import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const mkdtemp = jest.fn();
const lstat = jest.fn();
const realpath = jest.fn();
const rmdir = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ mkdtemp, lstat, realpath, rmdir }));

const { createSmokeTempRoot } =
  await import("../../../../src/validation/stages/smoke/create-smoke-temp-root.mjs");

const root = "C:/repo";
const tempRoot = join(root, ".eliware-tarball-smoke-123");
const identity = { dev: 1, ino: 2, isDirectory: () => true, isSymbolicLink: () => false };

beforeEach(() => {
  mkdtemp.mockReset().mockResolvedValue(tempRoot);
  lstat.mockReset().mockResolvedValue(identity);
  realpath.mockReset().mockImplementation(async (path) => path);
  rmdir.mockReset().mockResolvedValue(undefined);
});

test("creates a temporary root and records its identity", async () => {
  await expect(createSmokeTempRoot(root)).resolves.toEqual({ path: tempRoot, identity });
  expect(mkdtemp).toHaveBeenCalledWith(join(root, ".eliware-tarball-smoke-"));
  expect(lstat).toHaveBeenCalledWith(tempRoot);
  expect(realpath).toHaveBeenCalledWith(root);
  expect(realpath).toHaveBeenCalledWith(tempRoot);
});

test.each(["C:/outside/.eliware-tarball-smoke-123", "C:/repo/nested/.eliware-tarball-smoke-123"])(
  "rejects a temporary path that is not a direct child: %s",
  async (createdPath) => {
    mkdtemp.mockResolvedValue(createdPath);

    await expect(createSmokeTempRoot(root)).resolves.toEqual({
      error: "Temporary smoke directory must be a fresh child of the source checkout.",
    });
    expect(lstat).not.toHaveBeenCalled();
    expect(rmdir).not.toHaveBeenCalled();
  },
);

test("rejects a temporary-root adapter that returns an invalid path", async () => {
  mkdtemp.mockResolvedValue(undefined);

  await expect(createSmokeTempRoot(root)).resolves.toEqual({
    error: "Temporary smoke directory must be a fresh child of the source checkout.",
  });
  expect(lstat).not.toHaveBeenCalled();
  expect(rmdir).not.toHaveBeenCalled();
});

test("rejects a temporary path that resolves outside the source checkout", async () => {
  realpath.mockImplementation(async (path) =>
    path === tempRoot ? "C:/outside/.eliware-tarball-smoke-123" : path,
  );

  await expect(createSmokeTempRoot(root)).resolves.toEqual({
    error: `Cannot verify temporary smoke directory. left untrusted path untouched at ${tempRoot}.`,
  });
  expect(rmdir).not.toHaveBeenCalled();
});

test("rejects a temporary path that is not a real directory", async () => {
  lstat.mockResolvedValue({ ...identity, isSymbolicLink: () => true });

  await expect(createSmokeTempRoot(root)).resolves.toMatchObject({
    error: `Cannot verify temporary smoke directory. left untrusted path untouched at ${tempRoot}.`,
  });
  expect(realpath).not.toHaveBeenCalled();
  expect(rmdir).not.toHaveBeenCalled();
});

test("removes a temporary path that is not a directory", async () => {
  lstat.mockResolvedValue({ ...identity, isDirectory: () => false });

  await expect(createSmokeTempRoot(root)).resolves.toEqual({
    error: `Cannot verify temporary smoke directory. removed empty path ${tempRoot}: temporary path is not a directory`,
  });
  expect(rmdir).toHaveBeenCalledWith(tempRoot);
});

test("removes an unverified temporary directory", async () => {
  lstat.mockRejectedValue(new Error("inspection failed"));

  await expect(createSmokeTempRoot(root)).resolves.toEqual({
    error: `Cannot verify temporary smoke directory. removed empty path ${tempRoot}: inspection failed`,
  });
  expect(rmdir).toHaveBeenCalledWith(tempRoot);
});

test("reports cleanup errors for an unverified temporary directory", async () => {
  lstat.mockRejectedValue(new Error("inspection failed"));
  rmdir.mockRejectedValue(new Error("access denied"));

  await expect(createSmokeTempRoot(root)).resolves.toEqual({
    error: `Cannot verify temporary smoke directory. cleanup failed at ${tempRoot}: access denied`,
  });
});

test("does not report a missing path as a cleanup failure", async () => {
  lstat.mockRejectedValue(new Error("inspection failed"));
  rmdir.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

  await expect(createSmokeTempRoot(root)).resolves.toEqual({
    error: `Cannot verify temporary smoke directory. removed empty path ${tempRoot}: inspection failed`,
  });
});

test("uses filesystem defaults when temporary root creation fails", async () => {
  mkdtemp.mockRejectedValue(new Error("cannot create"));

  await expect(createSmokeTempRoot(root)).rejects.toThrow("cannot create");
  expect(lstat).not.toHaveBeenCalled();
});
