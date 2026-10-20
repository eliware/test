import { beforeEach, expect, jest, test } from "@jest/globals";
import { dirname, join } from "node:path";

const appendFileSync = jest.fn();
const lstatSync = jest.fn();
const mkdirSync = jest.fn();
const writeFileSync = jest.fn();
jest.unstable_mockModule("node:fs", () => ({
  appendFileSync,
  lstatSync,
  mkdirSync,
  writeFileSync,
}));
const { createTimingLog } = await import("../../../../src/cli/timing/create/timing-log.mjs");

beforeEach(() => {
  jest.resetAllMocks();
});

test("uses mocked default file operations and writes the timestamp and timing output", () => {
  const absent = () => {
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  };
  const directory = { isDirectory: () => true, isSymbolicLink: () => false };
  lstatSync
    .mockImplementationOnce(absent)
    .mockReturnValueOnce(directory)
    .mockImplementationOnce(absent);
  const startedAt = Date.parse("2026-10-20T12:00:00.000Z");

  const write = createTimingLog("/repo", startedAt);
  const path = join("/repo", "coverage", "eliware-test.log");
  write("[0.000s] Stage: npm prerequisite\n");

  expect(mkdirSync).toHaveBeenCalledWith(dirname(path), { recursive: true });
  expect(writeFileSync).toHaveBeenCalledWith(path, "Started: 2026-10-20T12:00:00.000Z\n", "utf8");
  expect(appendFileSync).toHaveBeenCalledWith(path, "[0.000s] Stage: npm prerequisite\n", "utf8");
});

test("uses injected operations when the coverage directory and log already exist", () => {
  const fileSystem = {
    append: jest.fn(),
    lstat: jest
      .fn()
      .mockReturnValueOnce({ isDirectory: () => true, isSymbolicLink: () => false })
      .mockReturnValueOnce({ isFile: () => true, isSymbolicLink: () => false }),
    mkdir: jest.fn(),
    replace: jest.fn(),
  };
  const path = join("/repo", "coverage", "eliware-test.log");

  createTimingLog("/repo", 0, fileSystem);

  expect(fileSystem.mkdir).not.toHaveBeenCalled();
  expect(fileSystem.replace).toHaveBeenCalledWith(
    path,
    "Started: 1970-01-01T00:00:00.000Z\n",
    "utf8",
  );
});

test("rejects a symbolic coverage directory", () => {
  const fileSystem = {
    lstat: jest.fn(() => ({ isDirectory: () => true, isSymbolicLink: () => true })),
    mkdir: jest.fn(),
    replace: jest.fn(),
  };

  expect(() => createTimingLog("/repo", 0, fileSystem)).toThrow(
    "coverage must be a real directory.",
  );
  expect(fileSystem.replace).not.toHaveBeenCalled();
});

test("rejects a coverage path that is not a directory", () => {
  const fileSystem = {
    lstat: jest.fn(() => ({ isDirectory: () => false, isSymbolicLink: () => false })),
    mkdir: jest.fn(),
    replace: jest.fn(),
  };

  expect(() => createTimingLog("/repo", 0, fileSystem)).toThrow(
    "coverage must be a real directory.",
  );
});

test("creates the directory and rejects it if it becomes a symlink", () => {
  const absent = () => {
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  };
  const fileSystem = {
    lstat: jest
      .fn()
      .mockImplementationOnce(absent)
      .mockReturnValueOnce({ isDirectory: () => false, isSymbolicLink: () => true }),
    mkdir: jest.fn(),
    replace: jest.fn(),
  };

  expect(() => createTimingLog("/repo", 0, fileSystem)).toThrow(
    "coverage must be a real directory.",
  );
  expect(fileSystem.mkdir).toHaveBeenCalledWith(join("/repo", "coverage"), { recursive: true });
  expect(fileSystem.replace).not.toHaveBeenCalled();
});

test("rejects a symbolic timing log", () => {
  const fileSystem = {
    lstat: jest
      .fn()
      .mockReturnValueOnce({ isDirectory: () => true, isSymbolicLink: () => false })
      .mockReturnValueOnce({ isFile: () => true, isSymbolicLink: () => true }),
    replace: jest.fn(),
  };

  expect(() => createTimingLog("/repo", 0, fileSystem)).toThrow(
    "coverage/eliware-test.log must be a regular file.",
  );
  expect(fileSystem.replace).not.toHaveBeenCalled();
});

test("rejects a timing log that is not a regular file", () => {
  const fileSystem = {
    lstat: jest
      .fn()
      .mockReturnValueOnce({ isDirectory: () => true, isSymbolicLink: () => false })
      .mockReturnValueOnce({ isFile: () => false, isSymbolicLink: () => false }),
    replace: jest.fn(),
  };

  expect(() => createTimingLog("/repo", 0, fileSystem)).toThrow(
    "coverage/eliware-test.log must be a regular file.",
  );
});

test("throws inspection errors other than missing paths", () => {
  const failure = new Error("permission denied");
  const fileSystem = {
    lstat: jest.fn(() => {
      throw failure;
    }),
  };

  expect(() => createTimingLog("/repo", 0, fileSystem)).toThrow(failure);
});

test("throws non-missing errors when inspecting the timing log", () => {
  const failure = new Error("permission denied");
  const fileSystem = {
    lstat: jest
      .fn()
      .mockReturnValueOnce({ isDirectory: () => true, isSymbolicLink: () => false })
      .mockImplementationOnce(() => {
        throw failure;
      }),
  };

  expect(() => createTimingLog("/repo", 0, fileSystem)).toThrow(failure);
});
