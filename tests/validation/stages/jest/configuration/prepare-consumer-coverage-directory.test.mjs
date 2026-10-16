import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const lstat = jest.fn();
const mkdir = jest.fn();
const readdir = jest.fn();
const rm = jest.fn();
const fileSystem = await import("node:fs/promises");

jest.unstable_mockModule("node:fs/promises", () => ({ ...fileSystem, lstat, mkdir, readdir, rm }));

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
});

test("removes old files and nested directories from consumer coverage", async () => {
  lstat.mockResolvedValue({ isSymbolicLink: () => false, isDirectory: () => true });
  readdir.mockResolvedValue(["old", "report.json"]);

  await expect(prepareConsumerCoverageDirectory(root)).resolves.toBe(coverage);
  expect(rm).toHaveBeenNthCalledWith(1, join(coverage, "old"), { recursive: true, force: true });
  expect(rm).toHaveBeenNthCalledWith(2, join(coverage, "report.json"), {
    recursive: true,
    force: true,
  });
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
