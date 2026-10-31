import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const lstat = jest.fn();
const mkdir = jest.fn();
const readdir = jest.fn();
const rm = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ lstat, mkdir, readdir, rm }));

const { prepareConsumerCoverageDirectory } =
  await import("../../../../../src/validation/stages/jest/configuration/prepare-consumer-coverage-directory.mjs");

const root = "C:/consumer";
const coverage = join(root, "coverage");

beforeEach(() => {
  lstat.mockReset();
  mkdir.mockReset().mockResolvedValue(undefined);
  readdir.mockReset();
  rm.mockReset().mockResolvedValue(undefined);
});

test("creates the consumer coverage directory when it does not exist", async () => {
  lstat.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

  await expect(prepareConsumerCoverageDirectory(root)).resolves.toBe(coverage);
  expect(mkdir).toHaveBeenCalledWith(coverage, { recursive: true });
  expect(mkdir).toHaveBeenCalledWith(join(coverage, "cache"), { recursive: true });
});

test("removes old files and nested directories from consumer coverage", async () => {
  lstat.mockResolvedValue({ isSymbolicLink: () => false, isDirectory: () => true });
  readdir.mockResolvedValue(["cache", "old", "report.json"]);

  await expect(prepareConsumerCoverageDirectory(root)).resolves.toBe(coverage);
  expect(rm).toHaveBeenNthCalledWith(1, join(coverage, "old"), { recursive: true, force: true });
  expect(rm).toHaveBeenNthCalledWith(2, join(coverage, "report.json"), {
    recursive: true,
    force: true,
  });
});

test("keeps the timing log and Jest cache when it clears prior coverage output", async () => {
  lstat.mockResolvedValue({ isSymbolicLink: () => false, isDirectory: () => true });
  readdir.mockResolvedValue(["cache", "eliware-test.log", "coverage-final.json"]);

  await expect(prepareConsumerCoverageDirectory(root)).resolves.toBe(coverage);
  expect(rm).toHaveBeenCalledTimes(1);
  expect(rm).toHaveBeenCalledWith(join(coverage, "coverage-final.json"), {
    recursive: true,
    force: true,
  });
});

test("creates the cache directory when it does not exist", async () => {
  lstat
    .mockResolvedValueOnce({ isSymbolicLink: () => false, isDirectory: () => true })
    .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
  readdir.mockResolvedValue(["eliware-test.log"]);

  await expect(prepareConsumerCoverageDirectory(root)).resolves.toBe(coverage);
  expect(mkdir).toHaveBeenCalledWith(join(coverage, "cache"), { recursive: true });
});

test("rejects a coverage symbolic link", async () => {
  lstat.mockResolvedValue({ isSymbolicLink: () => true, isDirectory: () => false });

  await expect(prepareConsumerCoverageDirectory(root)).rejects.toThrow(
    "coverage must not be a symbolic link.",
  );
  expect(readdir).not.toHaveBeenCalled();
});

test("rejects a coverage path that is a file", async () => {
  lstat.mockResolvedValue({ isSymbolicLink: () => false, isDirectory: () => false });

  await expect(prepareConsumerCoverageDirectory(root)).rejects.toThrow(
    "coverage must be a directory.",
  );
});

test("rejects a cache symbolic link", async () => {
  lstat
    .mockResolvedValueOnce({ isSymbolicLink: () => false, isDirectory: () => true })
    .mockResolvedValueOnce({ isSymbolicLink: () => true, isDirectory: () => false });

  await expect(prepareConsumerCoverageDirectory(root)).rejects.toThrow(
    "coverage/cache must not be a symbolic link.",
  );
  expect(readdir).not.toHaveBeenCalled();
});

test("reports cache inspection errors that are not missing-path errors", async () => {
  const error = Object.assign(new Error("denied"), { code: "EACCES" });
  lstat.mockResolvedValueOnce({ isSymbolicLink: () => false, isDirectory: () => true });
  lstat.mockRejectedValueOnce(error);

  await expect(prepareConsumerCoverageDirectory(root)).rejects.toBe(error);
  expect(readdir).not.toHaveBeenCalled();
});

test("rejects a cache path that is a file", async () => {
  lstat
    .mockResolvedValueOnce({ isSymbolicLink: () => false, isDirectory: () => true })
    .mockResolvedValueOnce({ isSymbolicLink: () => false, isDirectory: () => false });

  await expect(prepareConsumerCoverageDirectory(root)).rejects.toThrow(
    "coverage/cache must be a directory.",
  );
  expect(readdir).not.toHaveBeenCalled();
});
