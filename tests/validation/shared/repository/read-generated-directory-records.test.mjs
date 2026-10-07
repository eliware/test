import { expect, jest, test } from "@jest/globals";
import { readGeneratedDirectoryRecords } from "../../../../src/validation/shared/repository/read-generated-directory-records.mjs";

test("converts generated directory children and excludes unsupported entries", async () => {
  const readDirectory = jest.fn(async () => [
    { name: "assets", isDirectory: () => true, isFile: () => false },
    { name: "app.js", isDirectory: () => false, isFile: () => true },
    { name: "external", isDirectory: () => false, isFile: () => false },
  ]);

  await expect(readGeneratedDirectoryRecords("dist", readDirectory)).resolves.toEqual([
    { path: "dist/assets", type: "directory" },
    { path: "dist/app.js", type: "file" },
  ]);
  expect(readDirectory).toHaveBeenCalledWith("dist");
});

test("reuses records for cached entries and rebuilds them when entries change", async () => {
  const before = [{ name: "before.js", isDirectory: () => false, isFile: () => true }];
  const after = [{ name: "after.js", isDirectory: () => false, isFile: () => true }];
  const readDirectory = jest
    .fn()
    .mockResolvedValueOnce(before)
    .mockResolvedValueOnce(before)
    .mockResolvedValueOnce(after);

  const initial = await readGeneratedDirectoryRecords("dist", readDirectory);
  expect(initial).toEqual([{ path: "dist/before.js", type: "file" }]);
  await expect(readGeneratedDirectoryRecords("dist", readDirectory)).resolves.toBe(initial);
  await expect(readGeneratedDirectoryRecords("dist", readDirectory)).resolves.toEqual([
    { path: "dist/after.js", type: "file" },
  ]);
});
