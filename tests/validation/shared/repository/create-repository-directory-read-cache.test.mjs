import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { createRepositoryDirectoryReadCache } from "../../../../src/validation/shared/repository/create-repository-directory-read-cache.mjs";
const metadata = (mtimeNs) => ({ dev: 1n, ino: 2n, size: 0n, mtimeNs, ctimeNs: mtimeNs });
async function expectDirectoryReads(snapshot, platform, expectedCalls) {
  const root = join(process.cwd(), "inventory-fixture");
  const stat = jest.fn().mockResolvedValue(snapshot);
  const readDirectory = jest.fn().mockResolvedValue(["stable"]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, platform);
  await read("src");
  await read("src");
  expect(readDirectory).toHaveBeenCalledTimes(expectedCalls);
}
test("deduplicates concurrent directory reads and reuses unchanged listings", async () => {
  const root = join(process.cwd(), "inventory-fixture");
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
  const root = join(process.cwd(), "inventory-fixture");
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
test("preserves the last successful listing when a forced refresh fails", async () => {
  const root = join(process.cwd(), "inventory-fixture");
  const stat = jest
    .fn()
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n));
  const readDirectory = jest
    .fn()
    .mockResolvedValueOnce(["stable"])
    .mockRejectedValueOnce(new Error("refresh failed"));
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  await expect(read("src")).resolves.toEqual(["stable"]);
  await expect(read("src", true)).rejects.toThrow("refresh failed");
  await expect(read("src")).resolves.toEqual(["stable"]);
  expect(readDirectory).toHaveBeenCalledTimes(2);
});
test("uses one stat call to validate an unchanged cached listing", async () => {
  const root = join(process.cwd(), "inventory-fixture");
  const stat = jest.fn(async () => metadata(1n));
  const readDirectory = jest.fn().mockResolvedValue([]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  await read("src");
  stat.mockClear();
  await read("src");
  expect(stat).toHaveBeenCalledTimes(1);
  expect(readDirectory).toHaveBeenCalledTimes(1);
});
test("forced refresh waits for a pending read and starts a fresh listing", async () => {
  const root = join(process.cwd(), "inventory-fixture");
  const stat = jest
    .fn()
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(2n))
    .mockResolvedValueOnce(metadata(2n));
  let markStarted;
  let releaseRead;
  const readStarted = new Promise((resolve) => {
    markStarted = resolve;
  });
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
test("forced refresh retries after the pending read fails", async () => {
  const root = join(process.cwd(), "inventory-fixture");
  const stat = jest
    .fn()
    .mockRejectedValueOnce(new Error("temporary stat failure"))
    .mockResolvedValueOnce(metadata(1n))
    .mockResolvedValueOnce(metadata(1n));
  const readDirectory = jest.fn().mockResolvedValue(["retried"]);
  let rejectStat;
  const initialStatStarted = new Promise((resolve) => {
    rejectStat = resolve;
  });
  const firstStat = stat;
  const delayedStat = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        firstStat().then(resolve, reject);
        rejectStat();
      }),
  );
  const retryingRead = createRepositoryDirectoryReadCache(
    root,
    readDirectory,
    delayedStat,
    "linux",
  );
  const initial = retryingRead("src");
  await initialStatStarted;
  const refresh = retryingRead("src", true);
  await expect(initial).rejects.toThrow("temporary stat failure");
  await expect(refresh).resolves.toEqual(["retried"]);
});
test.each([
  [
    "coarse millisecond fields",
    { dev: 1n, ino: 2n, size: 0n, mtimeMs: 1n, ctimeMs: 1n },
    "linux",
    2,
  ],
  ["Windows metadata", metadata(1n), "win32", 2],
  ["millisecond-aligned nanoseconds", metadata(1_000_000n), "linux", 2],
  ["one precise nanosecond field", { ...metadata(1_000_000n), ctimeNs: 1n }, "linux", 1],
])("uses safe directory cache policy for %s", async (_name, snapshot, platform, expectedCalls) => {
  await expectDirectoryReads(snapshot, platform, expectedCalls);
});
test("detects nanosecond changes within the same millisecond", async () => {
  const root = join(process.cwd(), "inventory-fixture");
  const sameMillisecond = (mtimeNs) => ({ ...metadata(mtimeNs), mtimeMs: 1, ctimeMs: 1 });
  const stat = jest
    .fn()
    .mockResolvedValueOnce(sameMillisecond(1n))
    .mockResolvedValueOnce(sameMillisecond(1n))
    .mockResolvedValueOnce(sameMillisecond(2n))
    .mockResolvedValueOnce(sameMillisecond(2n));
  const readDirectory = jest.fn().mockResolvedValueOnce(["old"]).mockResolvedValueOnce(["new"]);
  const read = createRepositoryDirectoryReadCache(root, readDirectory, stat, "linux");
  await expect(read("src")).resolves.toEqual(["old"]);
  await expect(read("src")).resolves.toEqual(["new"]);
  expect(readDirectory).toHaveBeenCalledTimes(2);
});
test("rejects listings when a directory changes during readdir", async () => {
  const root = join(process.cwd(), "inventory-fixture");
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
});
test("uses the filesystem stat implementation by default", async () => {
  const readDirectory = jest.fn().mockResolvedValue([]);
  const read = createRepositoryDirectoryReadCache(process.cwd(), readDirectory);
  await expect(read(process.cwd())).resolves.toEqual([]);
  expect(readDirectory).toHaveBeenCalledTimes(1);
});
