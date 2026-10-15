import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { createSmokeTempRoot } from "../../../../src/validation/stages/smoke/create-smoke-temp-root.mjs";

test("returns the path and identity for a verified temporary directory", async () => {
  const createTempRoot = jest.fn().mockResolvedValue("temp-path");
  const inspect = jest.fn().mockResolvedValue({ ino: 2 });
  await expect(createSmokeTempRoot("repo-root", inspect, createTempRoot)).resolves.toEqual({
    path: "temp-path",
    identity: { ino: 2 },
  });
  expect(createTempRoot).toHaveBeenCalledWith(join("repo-root", ".eliware-tarball-smoke-"));
});

test("removes an empty temporary directory when identity inspection fails", async () => {
  const remove = jest.fn();
  const result = await createSmokeTempRoot(
    "repo-root",
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
    "repo-root",
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

test("requires the repository root", async () => {
  await expect(createSmokeTempRoot()).rejects.toThrow();
});
