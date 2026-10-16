import { expect, jest, test } from "@jest/globals";
import { createRepositoryScopedEntryReader } from "../../../../../src/validation/shared/repository/create-repository/scoped-entry-reader.mjs";
test("filters directly discovered records within the requested subtree", async () => {
  const records = [
    { path: "src", type: "directory", depth: 1 },
    { path: "src/module.mjs", type: "file", depth: 1 },
    { path: "docs/readme.md", type: "file", depth: 1 },
  ];
  const entriesUnder = createRepositoryScopedEntryReader({
    root: "/repo",
    entryReader: {
      entries: async () => records,
      subtreeEntries: new Map(),
      hasFullDiscovery: () => true,
    },
  });
  await expect(entriesUnder("/repo/src", (path) => path.endsWith(".mjs"))).resolves.toEqual(
    records.slice(0, 2),
  );
});

test("reuses the pending scoped inventory for repeated requests", async () => {
  const findEntries = jest.fn(async () => [{ path: "src/a.mjs", type: "file", depth: 2 }]);
  const entriesUnder = createRepositoryScopedEntryReader({
    root: "/repo",
    findEntries,
    readDirectoryCached: async () => [],
    entryReader: {
      entries: async () => [],
      subtreeEntries: new Map(),
      hasFullDiscovery: () => false,
    },
  });
  await Promise.all([entriesUnder("/repo/src"), entriesUnder("/repo/src")]);
  expect(findEntries).toHaveBeenCalledTimes(1);
});

test("reads the repository root and applies file filters only to files", async () => {
  const records = [
    { path: "src", type: "directory", depth: 1 },
    { path: "src/a.mjs", type: "file", depth: 1 },
    { path: "src/a.test.mjs", type: "file", depth: 1 },
    { path: "src/readme.txt", type: "file", depth: 1 },
  ];
  const entries = jest.fn(async () => records);
  const entriesUnder = createRepositoryScopedEntryReader({
    root: "/repo",
    entryReader: { entries, subtreeEntries: new Map(), hasFullDiscovery: () => false },
  });

  await expect(entriesUnder()).resolves.toEqual(records);
  await expect(entriesUnder("/repo", (path) => path.endsWith(".mjs"))).resolves.toEqual(
    records.slice(0, 3),
  );
});

test("uses scoped discovery and full records when discovery completes during traversal", async () => {
  const fullRecords = [
    { path: "src", type: "directory", depth: 1 },
    { path: "src/a.mjs", type: "file", depth: 1 },
  ];
  const entries = jest.fn(async () => fullRecords);
  const hasFullDiscovery = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  const findEntries = jest.fn(async () => [{ path: "src/a.mjs", type: "file", depth: 1 }]);
  const entriesUnder = createRepositoryScopedEntryReader({
    root: "/repo",
    findEntries,
    entryReader: { entries, subtreeEntries: new Map(), hasFullDiscovery },
  });

  await expect(entriesUnder("/repo/src", (path) => path.endsWith(".mjs"))).resolves.toEqual(
    fullRecords,
  );
  expect(findEntries).toHaveBeenCalledTimes(1);
});

test("filters scoped discovery records when full discovery remains incomplete", async () => {
  const entriesUnder = createRepositoryScopedEntryReader({
    root: "/repo",
    findEntries: jest.fn(async () => [
      { path: "src/a.mjs", type: "file", depth: 1 },
      { path: "src/readme.txt", type: "file", depth: 1 },
    ]),
    entryReader: {
      entries: async () => [],
      subtreeEntries: new Map(),
      hasFullDiscovery: () => false,
    },
  });

  await expect(entriesUnder("/repo/src", (path) => path.endsWith(".mjs"))).resolves.toEqual([
    { path: "src/a.mjs", type: "file", depth: 1 },
  ]);
});

test("returns full discovered records after scoped traversal completes", async () => {
  const fullRecords = [
    { path: "src", type: "directory", depth: 1 },
    { path: "src/a.mjs", type: "file", depth: 1 },
    { path: "docs/readme.md", type: "file", depth: 1 },
  ];
  const hasFullDiscovery = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  const entries = jest.fn(async () => fullRecords);
  const entriesUnder = createRepositoryScopedEntryReader({
    root: "/repo",
    findEntries: jest.fn(async () => [{ path: "src/a.mjs", type: "file", depth: 1 }]),
    entryReader: { entries, subtreeEntries: new Map(), hasFullDiscovery },
  });

  await expect(entriesUnder("/repo/src")).resolves.toEqual(fullRecords.slice(0, 2));
  expect(entries).toHaveBeenCalledTimes(1);
});

test("uses the default repository traversal when no custom entry finder is set", async () => {
  const file = { name: "a.mjs", isDirectory: () => false, isFile: () => true };
  const entriesUnder = createRepositoryScopedEntryReader({
    root: "C:\\repo",
    findEntries: (
      await import("../../../../../src/validation/shared/repository/find-repository-files.mjs")
    ).findRepositoryEntries,
    readDirectoryCached: async () => [file],
    entryReader: {
      entries: async () => [],
      subtreeEntries: new Map(),
      hasFullDiscovery: () => false,
    },
  });

  await expect(entriesUnder("C:\\repo\\src")).resolves.toEqual([
    { path: "src", type: "directory", depth: 1 },
    { path: "src/a.mjs", type: "file", depth: 1 },
  ]);
});
