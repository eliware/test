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
