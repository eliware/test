import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { readGeneratedDirectoryEntries } from "../../../../../../../src/validation/shared/repository/create-repository/directory/read/generated-entries.mjs";

const baseOptions = {
  base: "dist/reports",
  directory: "/repo/dist/reports",
  prunedDirectory: "dist",
  children: [],
  root: "/repo",
  readDirectory: jest.fn(async () => [
    { name: "report.json", isFile: () => true, isDirectory: () => false },
  ]),
};

test("reads direct generated directory children after confirming the path is a directory", async () => {
  const statDirectory = jest.fn(async () => ({ isDirectory: () => true }));
  await expect(
    readGeneratedDirectoryEntries({ ...baseOptions, statDirectory }),
  ).resolves.toMatchObject([{ path: "dist/reports/report.json", type: "file" }]);
  expect(statDirectory).toHaveBeenCalledWith(join("/repo", "dist/reports"), { bigint: true });
});

test("rejects generated paths that are files", async () => {
  await expect(
    readGeneratedDirectoryEntries({
      ...baseOptions,
      statDirectory: async () => ({ isDirectory: () => false }),
    }),
  ).rejects.toMatchObject({ code: "ENOTDIR" });
});

test("does not read generated descendants when indexed children exist", async () => {
  const statDirectory = jest.fn();
  const children = [{ path: "dist/reports/current", type: "directory" }];
  await expect(
    readGeneratedDirectoryEntries({ ...baseOptions, children, statDirectory }),
  ).resolves.toBe(children);
  expect(statDirectory).not.toHaveBeenCalled();
});
