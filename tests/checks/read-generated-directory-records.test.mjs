import { expect, jest, test } from "@jest/globals";
import { readGeneratedDirectoryRecords } from "../../src/checks/read-generated-directory-records.mjs";

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

test("reads generated-directory records afresh for each request", async () => {
  const readDirectory = jest
    .fn()
    .mockResolvedValueOnce([{ name: "before.js", isDirectory: () => false, isFile: () => true }])
    .mockResolvedValueOnce([{ name: "after.js", isDirectory: () => false, isFile: () => true }]);

  await expect(readGeneratedDirectoryRecords("dist", readDirectory)).resolves.toEqual([
    { path: "dist/before.js", type: "file" },
  ]);
  await expect(readGeneratedDirectoryRecords("dist", readDirectory)).resolves.toEqual([
    { path: "dist/after.js", type: "file" },
  ]);
});
