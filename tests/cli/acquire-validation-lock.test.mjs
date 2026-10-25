import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const open = jest.fn();
const readFile = jest.fn();
const unlink = jest.fn();
const lstat = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ open, readFile, unlink, lstat }));

const { acquireValidationLock } = await import("../../src/cli/acquire-validation-lock.mjs");

const root = "C:/repo";
const lockPath = join(root, "eliware-test.lock");

function createHandle() {
  return {
    writeFile: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ dev: 1, ino: 2 }),
  };
}

function setSuccessfulOpen(handle) {
  open.mockResolvedValue(handle);
  readFile.mockImplementation(async () => handle.writeFile.mock.calls[0][0]);
}

beforeEach(() => {
  open.mockReset();
  readFile.mockReset();
  unlink.mockReset().mockResolvedValue(undefined);
  lstat.mockReset().mockResolvedValue({ dev: 1, ino: 2 });
});

test("creates a repository lock and removes it when released", async () => {
  const handle = createHandle();
  setSuccessfulOpen(handle);

  const release = await acquireValidationLock(root);
  const lock = JSON.parse(handle.writeFile.mock.calls[0][0]);
  expect(open).toHaveBeenCalledWith(lockPath, "wx");
  expect(lock.pid).toBe(process.pid);
  expect(lock.startedAt).toEqual(expect.any(String));
  await release();
  expect(unlink).toHaveBeenCalledWith(lockPath);
});

test("refuses to acquire an existing repository lock", async () => {
  open.mockRejectedValue(Object.assign(new Error("active lock"), { code: "EEXIST" }));

  await expect(acquireValidationLock(root)).resolves.toBeNull();
  expect(unlink).not.toHaveBeenCalled();
});

test("allows only one lock acquisition when runs start concurrently", async () => {
  const handle = createHandle();
  setSuccessfulOpen(handle);
  open
    .mockReset()
    .mockResolvedValueOnce(handle)
    .mockRejectedValueOnce(Object.assign(new Error("active lock"), { code: "EEXIST" }));

  const releases = await Promise.all([acquireValidationLock(root), acquireValidationLock(root)]);
  expect(releases.filter(Boolean)).toHaveLength(1);
  expect(open).toHaveBeenCalledTimes(2);
});

test("does not remove a lock file replaced after this run acquired its lock", async () => {
  const handle = createHandle();
  open.mockResolvedValue(handle);
  readFile.mockResolvedValue('{"lockId":"another-run"}');

  const release = await acquireValidationLock(root);
  await release();
  expect(unlink).not.toHaveBeenCalled();
});

test("does not remove a replacement installed after the lock read", async () => {
  const handle = createHandle();
  setSuccessfulOpen(handle);
  lstat.mockResolvedValue({ dev: 3, ino: 4 });

  const release = await acquireValidationLock(root);
  await release();

  expect(unlink).not.toHaveBeenCalled();
});

test("propagates failures other than an existing lock", async () => {
  const error = Object.assign(new Error("access denied"), { code: "EACCES" });
  open.mockRejectedValue(error);

  await expect(acquireValidationLock(root)).rejects.toBe(error);
});

test("removes a partially written lock when writing its metadata fails", async () => {
  const handle = createHandle();
  handle.writeFile.mockRejectedValue(new Error("disk full"));
  open.mockResolvedValue(handle);

  await expect(acquireValidationLock(root)).rejects.toThrow("disk full");
  expect(handle.close).toHaveBeenCalledTimes(1);
  expect(unlink).toHaveBeenCalledWith(lockPath);
});

test("removes a newly written lock when closing its handle fails", async () => {
  const closeError = new Error("close failed");
  const handle = createHandle();
  handle.close.mockRejectedValue(closeError);
  open.mockResolvedValue(handle);

  await expect(acquireValidationLock(root)).rejects.toBe(closeError);
  expect(unlink).toHaveBeenCalledWith(lockPath);
});

test("reports a lock that may remain when handle close and cleanup fail", async () => {
  const closeError = new Error("close failed");
  const unlinkError = new Error("unlink failed");
  const handle = createHandle();
  handle.close.mockRejectedValue(closeError);
  open.mockResolvedValue(handle);
  unlink.mockRejectedValue(unlinkError);

  const error = await acquireValidationLock(root).catch((value) => value);
  expect(error).toBeInstanceOf(AggregateError);
  expect(error.errors).toEqual([closeError, unlinkError]);
  expect(error.message).toContain("A stale lock can stay");
});

test.each([
  {
    name: "a partial write and cleanup",
    writeMessage: "disk full",
    closeMessage: "close failed",
    cleanupMessage: "access denied",
    expectedMessage:
      `Could not write lock metadata and cleanup failed. The unfinished lock can stay at ${lockPath}. ` +
      "Remove it after you confirm that no validation run is active.",
    expectedErrors: ["write", "close", "cleanup"],
    cause: "write",
  },
  {
    name: "a handle close and cleanup",
    closeMessage: "close failed",
    cleanupMessage: "access denied",
    expectedMessage: `Could not close the validation lock. A stale lock can stay at ${lockPath}.`,
    expectedErrors: ["close", "cleanup"],
    cause: "close",
  },
])("reports aggregate errors after $name fails", async (scenario) => {
  const errors = {
    write: scenario.writeMessage ? new Error(scenario.writeMessage) : undefined,
    close: new Error(scenario.closeMessage),
    cleanup: new Error(scenario.cleanupMessage),
  };
  const handle = createHandle();
  if (errors.write) handle.writeFile.mockRejectedValue(errors.write);
  handle.close.mockRejectedValue(errors.close);
  open.mockResolvedValue(handle);
  unlink.mockRejectedValue(errors.cleanup);

  const error = await acquireValidationLock(root).catch((value) => value);
  expect(error).toBeInstanceOf(AggregateError);
  expect(error.message).toBe(scenario.expectedMessage);
  expect(error.errors).toEqual(scenario.expectedErrors.map((key) => errors[key]));
  expect(error.cause).toBe(errors[scenario.cause]);
});

test("reports close failure when partial lock removal succeeds", async () => {
  const writeError = new Error("disk full");
  const closeError = new Error("close failed");
  const handle = createHandle();
  handle.writeFile.mockRejectedValue(writeError);
  handle.close.mockRejectedValue(closeError);
  open.mockResolvedValue(handle);

  const error = await acquireValidationLock(root).catch((value) => value);
  expect(error).toBeInstanceOf(AggregateError);
  expect(error.message).toBe("Could not write lock metadata and cleanup failed.");
  expect(error.errors).toEqual([writeError, closeError]);
});

test("treats a lock removed before release as already released", async () => {
  const handle = createHandle();
  open.mockResolvedValue(handle);
  readFile.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

  const release = await acquireValidationLock(root);
  await expect(release()).resolves.toBeUndefined();
});

test("reports lock cleanup errors other than a missing lock file", async () => {
  const handle = createHandle();
  open.mockResolvedValue(handle);
  readFile.mockRejectedValue(Object.assign(new Error("access denied"), { code: "EACCES" }));

  const release = await acquireValidationLock(root);
  await expect(release()).rejects.toMatchObject({ code: "EACCES" });
});
