import { expect, jest, test } from "@jest/globals";
import { resolve } from "node:path";
import { verifySmokeTempRoot } from "../../../../src/validation/stages/smoke/verify-smoke-temp-root.mjs";

const root = "C:/repo";
const path = "C:/repo/.eliware-tarball-smoke-one";
const identity = { isDirectory: () => true, isSymbolicLink: () => false };
const resolvePath = async (value) => value;

test("returns the verified path and identity", async () => {
  await expect(
    verifySmokeTempRoot(root, path, async () => identity, jest.fn(), resolvePath),
  ).resolves.toEqual({
    path: resolve(path),
    identity,
  });
});

test("rejects a created path that is not a fresh child", async () => {
  await expect(
    verifySmokeTempRoot(root, "C:/outside/temp", jest.fn(), jest.fn(), resolvePath),
  ).resolves.toEqual({
    error: "Temporary smoke directory must be a fresh child of the source checkout.",
  });
});

test("leaves a symbolic link untouched", async () => {
  const remove = jest.fn();
  await expect(
    verifySmokeTempRoot(
      root,
      path,
      async () => ({ isSymbolicLink: () => true }),
      remove,
      resolvePath,
    ),
  ).resolves.toMatchObject({ error: expect.stringContaining("left untrusted path untouched") });
  expect(remove).not.toHaveBeenCalled();
});

test("removes an invalid directory and reports cleanup errors", async () => {
  const remove = jest.fn();
  const notDirectory = { isSymbolicLink: () => false, isDirectory: () => false };
  await expect(
    verifySmokeTempRoot(root, path, async () => notDirectory, remove, resolvePath),
  ).resolves.toMatchObject({
    error: expect.stringContaining("removed empty path"),
  });
  expect(remove).toHaveBeenCalledWith(resolve(path));

  remove.mockRejectedValue(new Error("access denied"));
  await expect(
    verifySmokeTempRoot(root, path, async () => notDirectory, remove, resolvePath),
  ).resolves.toMatchObject({
    error: expect.stringContaining("cleanup failed"),
  });
});
