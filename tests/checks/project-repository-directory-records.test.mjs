import { expect, test } from "@jest/globals";
import { projectRepositoryDirectoryRecords } from "../../src/checks/project-repository-directory-records.mjs";

test("projects file and directory records as directory entries", () => {
  const entries = projectRepositoryDirectoryRecords([
    { path: "src/index.mjs", type: "file" },
    { path: "src/nested", type: "directory" },
  ]);
  expect(entries.map(({ name, path }) => ({ name, path }))).toEqual([
    { name: "index.mjs", path: "src/index.mjs" },
    { name: "nested", path: "src/nested" },
  ]);
  expect(entries[0].isFile()).toBe(true);
  expect(entries[0].isDirectory()).toBe(false);
  expect(entries[1].isFile()).toBe(false);
  expect(entries[1].isDirectory()).toBe(true);
});
