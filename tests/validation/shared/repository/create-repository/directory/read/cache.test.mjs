import { expect, jest, test } from "@jest/globals";
import {
  repositoryDirectoryCacheRoot as root,
  repositoryDirectoryMetadata as metadata,
} from "../../../../../../../test-fixtures/repository-directory-cache-fixtures.mjs";
import { verifyDirectoryCacheBirthtimeRefresh } from "../../../../../../../test-fixtures/verify-directory-cache-birthtime.mjs";
import { join } from "node:path";
import { createRepositoryDirectoryReadCache } from "../../../../../../../src/validation/shared/repository/create-repository/directory/read/cache.mjs";
test("deduplicates concurrent directory reads and reuses unchanged listings", async () => {
  const stat = jest.fn(async () => metadata(1n));
  const entries = [];
  const readDirectory = jest.fn(async () => entries);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  const first = read("src");
  const concurrent = read(join(root, "src"));
  expect(concurrent).toBe(first);
  await expect(first).resolves.toBe(entries);
  await expect(read("src")).resolves.toBe(entries);
  expect(readDirectory).toHaveBeenCalledTimes(1);
  expect(readDirectory).toHaveBeenCalledWith(join(root, "src"), { withFileTypes: true });
});
test("refreshes a directory listing when its on-disk version changes", async () => {
  const stat = jest
    .fn()
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n));
  const readDirectory = jest.fn().mockResolvedValueOnce(["old"]).mockResolvedValueOnce(["new"]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  await expect(read("src")).resolves.toEqual(["old"]);
  expect(read.getRevision()).toBe(0);
  await expect(read("src")).resolves.toEqual(["new"]);
  expect(stat).toHaveBeenCalledTimes(4);
  expect(read.getRevision()).toBe(1);
  expect(read.getTrackedDirectories()).toEqual([join(root, "src")]);
  expect(readDirectory).toHaveBeenCalledTimes(2);
});
test("uses one stat call to validate an unchanged cached listing", async () => {
  const stat = jest.fn(async () => metadata(1n));
  const readDirectory = jest.fn().mockResolvedValue([]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  await read("src");
  stat.mockClear();
  await read("src");
  expect(stat).toHaveBeenCalledTimes(1);
  expect(readDirectory).toHaveBeenCalledTimes(1);
});
test("uses the filesystem stat function by default", async () => {
  const readDirectory = jest.fn().mockResolvedValue([]);
  const read = createRepositoryDirectoryReadCache(process.cwd(), readDirectory);
  await expect(read(process.cwd())).resolves.toEqual([]);
  expect(readDirectory).toHaveBeenCalledTimes(1);
});
test("rejects listings when a directory changes during readdir", async () => {
  const stat = jest.fn().mockResolvedValueOnce(metadata(1n)).mockResolvedValueOnce(metadata(2n));
  const readDirectory = jest.fn().mockResolvedValue(["possibly-incomplete"]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat);
  await expect(read("src")).rejects.toThrow("Directory changed while reading repository entries");
  expect(readDirectory).toHaveBeenCalledTimes(1);
});
test("drops a failed listing so a later read can retry", async () => {
  const stat = jest
    .fn()
    .mockRejectedValueOnce(new Error("stat denied"))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n));
  const readDirectory = jest.fn().mockResolvedValue(["entry"]);
  const read = createRepositoryDirectoryReadCache("/repo", readDirectory, stat);
  await expect(read("src")).rejects.toThrow("stat denied");
  await expect(read("src")).resolves.toEqual(["entry"]);
  expect(readDirectory).toHaveBeenCalledTimes(1);
  read.forget("missing");
  expect(read.getRevision()).toBe(0);
  read.forget("src");
  expect(read.getRevision()).toBe(1);
  expect(read.getTrackedDirectories()).toEqual([]);
});

test("preserves the last successful listing when a forced refresh fails", async () => {
  const stat = jest
    .fn()
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(3n))
    .mockResolvedValueOnce(metadata(3n))
    .mockResolvedValueOnce(metadata(3n))
    .mockResolvedValueOnce(metadata(3n));
  let rejectRefresh;
  let markRefreshStarted;
  const refreshStarted = new Promise((resolve) => (markRefreshStarted = resolve));
  const readDirectory = jest
    .fn()
    .mockResolvedValueOnce(["stable"])
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectRefresh = reject;
          markRefreshStarted();
        }),
    )
    .mockResolvedValueOnce(["refreshed"]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  await expect(read("src")).resolves.toEqual(["stable"]);
  const refresh = read("src", true);
  await refreshStarted;
  const concurrentRefresh = read("src", true);
  rejectRefresh(new Error("refresh failed"));
  await expect(refresh).rejects.toThrow("refresh failed");
  await expect(concurrentRefresh).resolves.toEqual(["refreshed"]);
  await expect(read("src")).resolves.toEqual(["refreshed"]);
  expect(readDirectory).toHaveBeenCalledTimes(3);
});

test("waits for a pending listing before a forced refresh", async () => {
  const stat = jest
    .fn()
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n));
  let releaseRead;
  let markStarted;
  const readStarted = new Promise((resolve) => (markStarted = resolve));
  const readDirectory = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseRead = resolve;
          markStarted();
        }),
    )
    .mockResolvedValueOnce(["fresh"]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  const initial = read("src");
  await readStarted;
  const refresh = read("src", true);
  releaseRead(["initial"]);
  await expect(initial).resolves.toEqual(["initial"]);
  await expect(refresh).resolves.toEqual(["fresh"]);
  expect(readDirectory).toHaveBeenCalledTimes(2);
});

test("retries a forced refresh after a pending stat fails", async () => {
  const stat = jest
    .fn()
    .mockRejectedValueOnce(new Error("temporary stat failure"))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n));
  const readDirectory = jest.fn().mockResolvedValue(["retried"]);
  let rejectStat;
  const initialStatStarted = new Promise((resolve) => (rejectStat = resolve));
  const delayedStat = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        stat().then(resolve, reject);
        rejectStat();
      }),
  );
  const read = createRepositoryDirectoryReadCache(root, readDirectory, delayedStat, "linux");
  const initial = read("src");
  await initialStatStarted;
  const refresh = read("src", true);
  await expect(initial).rejects.toThrow("temporary stat failure");
  await expect(refresh).resolves.toEqual(["retried"]);
});

test("refreshes a recreated directory when its birth time changes", async () => {
  const { read, readDirectory } = await verifyDirectoryCacheBirthtimeRefresh(jest);
  await expect(read("src")).resolves.toEqual(["old"]);
  await expect(read("src")).resolves.toEqual(["new"]);
  expect(readDirectory).toHaveBeenCalledTimes(2);
});
