import { expect, jest, test } from "@jest/globals";
import { createRepositoryDirectoryEntries } from "../../src/checks/create-repository-directory-entries.mjs";

const fileEntry = (name) => ({ name, isFile: () => true, isDirectory: () => false });

test("projects unexpanded directory entries from scoped inventory discovery", async () => {
  const entriesUnder = jest.fn(async () => [
    { path: "src", type: "directory" },
    { path: "src/entry.mjs", type: "file" },
  ]);
  const readDirectory = jest.fn();
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(),
    entriesUnder,
    readDirectory,
    hasFullDiscovery: () => false,
  });

  const scopedEntries = await directoryEntries("/repo/src");
  expect(scopedEntries).toMatchObject([{ name: "entry.mjs", path: "src/entry.mjs" }]);
  expect(scopedEntries[0].isFile()).toBe(true);
  expect(scopedEntries[0].isDirectory()).toBe(false);
  expect(entriesUnder).toHaveBeenCalledWith("/repo/src");
  expect(readDirectory).not.toHaveBeenCalled();
  await expect(directoryEntries("/repo/missing")).rejects.toMatchObject({ code: "ENOENT" });
});

test("projects indexed records and rebuilds the index when discovery changes", async () => {
  const initial = [
    { path: "README.md", type: "file" },
    { path: "src", type: "directory" },
    { path: "src/index.mjs", type: "file" },
  ];
  let current = initial;
  const discovery = jest.fn(async () => current);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: () => discovery(),
    entriesUnder: jest.fn(),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => true,
  });

  const rootEntries = await directoryEntries("/repo");
  expect(rootEntries).toMatchObject([
    { name: "README.md", path: "README.md" },
    { name: "src", path: "src" },
  ]);
  expect(rootEntries[0].isFile()).toBe(true);
  expect(rootEntries[1].isDirectory()).toBe(true);
  const sourceEntries = await directoryEntries("/repo/src");
  expect(sourceEntries).toMatchObject([{ name: "index.mjs", path: "src/index.mjs" }]);
  expect(sourceEntries[0].isFile()).toBe(true);
  expect(sourceEntries[0].isDirectory()).toBe(false);
  current = [...initial, { path: "src/new.mjs", type: "file" }];
  await expect(directoryEntries("/repo/src")).resolves.toMatchObject([
    { name: "index.mjs", path: "src/index.mjs" },
    { name: "new.mjs", path: "src/new.mjs" },
  ]);
  expect(discovery).toHaveBeenCalledTimes(3);
});

test("reads direct descendants of discovered generated directories", async () => {
  const readDirectory = jest.fn(async () => [fileEntry("app.js")]);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => [
      { path: "src", type: "directory" },
      { path: "src/coverage", type: "directory" },
    ]),
    entriesUnder: jest.fn(),
    readDirectory,
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/src/coverage/reports")).resolves.toMatchObject([
    { name: "app.js", path: "src/coverage/reports/app.js" },
  ]);
  expect(readDirectory).toHaveBeenCalledWith("src/coverage/reports");
});

test("rejects unknown and external directory paths", async () => {
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => []),
    entriesUnder: jest.fn(),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/missing")).rejects.toMatchObject({ code: "ENOENT" });
  await expect(directoryEntries("/outside")).rejects.toThrow("inside the repository");
});
