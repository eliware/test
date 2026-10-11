import { expect, jest, test } from "@jest/globals";
import { rmdir } from "node:fs/promises";
import { createSmokeTempRoot } from "../../../../src/validation/stages/smoke/create-smoke-temp-root.mjs";

test("returns the path and identity for a verified temporary directory", async () => {
  const createTempRoot = jest.fn().mockResolvedValue("temp-path");
  const inspect = jest.fn().mockResolvedValue({ ino: 2 });
  await expect(createSmokeTempRoot(inspect, createTempRoot)).resolves.toEqual({
    path: "temp-path",
    identity: { ino: 2 },
  });
});

test("removes an empty temporary directory when identity inspection fails", async () => {
  const remove = jest.fn();
  const result = await createSmokeTempRoot(
    async () => {
      throw new Error("stat failed");
    },
    async () => "temp-path",
    remove,
  );
  expect(result.error).toContain("removed empty path temp-path");
  expect(remove).toHaveBeenCalledWith("temp-path");
});

test.each([
  ["ENOENT", "removed empty path"],
  ["EACCES", "cleanup failed at"],
])("reports cleanup result %s when identity inspection fails", async (code, expected) => {
  const result = await createSmokeTempRoot(
    async () => {
      throw new Error("stat failed");
    },
    async () => "temp-path",
    async () => {
      throw Object.assign(new Error("remove failed"), { code });
    },
  );
  expect(result.error).toContain(expected);
});

test("uses default temporary directory operations", async () => {
  const result = await createSmokeTempRoot(undefined, undefined, rmdir);
  expect(result.path).toContain("eliware-tarball-smoke-");
  expect(result.identity.isDirectory()).toBe(true);
  await rmdir(result.path);
});
