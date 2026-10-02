import { jest } from "@jest/globals";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { acquireValidationLock } from "../../src/cli/acquire-validation-lock.mjs";

test("creates a repository lock and removes it when released", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-validation-lock-"));
  try {
    const release = await acquireValidationLock(root);
    const lockPath = join(root, "eliware-test.lock");
    const lock = JSON.parse(await readFile(lockPath, "utf8"));
    expect(lock.pid).toBe(process.pid);
    expect(lock.startedAt).toEqual(expect.any(String));
    await release();
    await expect(readFile(lockPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("refuses to acquire an existing repository lock", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-validation-lock-existing-"));
  try {
    const lockPath = join(root, "eliware-test.lock");
    await writeFile(lockPath, "active lock");
    await expect(acquireValidationLock(root)).resolves.toBeNull();
    await expect(readFile(lockPath, "utf8")).resolves.toBe("active lock");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("allows only one lock acquisition when runs start concurrently", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-validation-lock-race-"));
  try {
    const releases = await Promise.all([acquireValidationLock(root), acquireValidationLock(root)]);
    expect(releases.filter(Boolean)).toHaveLength(1);
    await releases.find(Boolean)();
    await expect(readFile(join(root, "eliware-test.lock"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not remove a lock file replaced after this run acquired its lock", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-validation-lock-replaced-"));
  try {
    const lockPath = join(root, "eliware-test.lock");
    const release = await acquireValidationLock(root);
    await writeFile(lockPath, JSON.stringify({ lockId: "another-run" }));
    await release();
    await expect(readFile(lockPath, "utf8")).resolves.toBe('{"lockId":"another-run"}');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("propagates failures other than an existing lock", async () => {
  await expect(
    acquireValidationLock(join(tmpdir(), "missing-validation-lock-root")),
  ).rejects.toMatchObject({ code: "ENOENT" });
});

test("removes a partially written lock when writing its metadata fails", async () => {
  const close = jest.fn();
  const unlink = jest.fn();
  const open = jest.fn(async () => ({
    writeFile: jest.fn().mockRejectedValue(new Error("disk full")),
    close,
  }));

  await expect(acquireValidationLock("/repo", { open, unlink })).rejects.toThrow("disk full");

  expect(close).toHaveBeenCalledTimes(1);
  expect(unlink).toHaveBeenCalledWith(join("/repo", "eliware-test.lock"));
});

test("reports both lock-write and partial-lock cleanup failures", async () => {
  const writeError = new Error("disk full");
  const closeError = new Error("close failed");
  const cleanupError = new Error("access denied");
  const open = jest.fn(async () => ({
    writeFile: jest.fn().mockRejectedValue(writeError),
    close: jest.fn().mockRejectedValue(closeError),
  }));
  const unlink = jest.fn().mockRejectedValue(cleanupError);

  const error = await acquireValidationLock("/repo", { open, unlink }).catch((value) => value);
  expect(error).toBeInstanceOf(AggregateError);
  expect(error.message).toContain(
    "partial lock may remain at " + join("/repo", "eliware-test.lock"),
  );
  expect(error.errors).toEqual([writeError, closeError, cleanupError]);
  expect(error.cause).toBe(writeError);
});

test("reports close failure when partial lock removal succeeds", async () => {
  const writeError = new Error("disk full");
  const closeError = new Error("close failed");
  const error = await acquireValidationLock("/repo", {
    open: async () => ({
      writeFile: async () => {
        throw writeError;
      },
      close: async () => {
        throw closeError;
      },
    }),
    unlink: jest.fn(),
  }).catch((value) => value);

  expect(error).toBeInstanceOf(AggregateError);
  expect(error.message).toBe("Could not write lock metadata and cleanup failed.");
  expect(error.errors).toEqual([writeError, closeError]);
});

test("treats a lock removed before release as already released", async () => {
  const readFile = jest
    .fn()
    .mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  const release = await acquireValidationLock("/repo", {
    open: async () => ({ writeFile: async () => {}, close: async () => {} }),
    readFile,
  });

  await expect(release()).resolves.toBeUndefined();
});

test("reports lock cleanup errors other than a missing lock file", async () => {
  const readFile = jest
    .fn()
    .mockRejectedValue(Object.assign(new Error("access denied"), { code: "EACCES" }));
  const release = await acquireValidationLock("/repo", {
    open: async () => ({ writeFile: async () => {}, close: async () => {} }),
    readFile,
  });

  await expect(release()).rejects.toMatchObject({ code: "EACCES" });
});
