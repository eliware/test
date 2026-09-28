import { expect, jest, test } from "@jest/globals";
import { createRepositoryInventory } from "../../src/checks/create-repository-inventory.mjs";

test("composes a frozen inventory facade over shared repository discovery", async () => {
  const findEntries = jest.fn(async () => [
    { path: "README.md", type: "file", depth: 0 },
    { path: "src", type: "directory", depth: 1 },
    { path: "src/index.mjs", type: "file", depth: 1 },
  ]);
  const inventory = createRepositoryInventory("/repo", { findEntries });

  expect(Object.isFrozen(inventory)).toBe(true);
  expect(inventory.root).toBe("/repo");
  await expect(inventory.repositoryFiles()).resolves.toEqual(["README.md", "src/index.mjs"]);
  expect(findEntries).toHaveBeenCalledTimes(1);
  expect(findEntries).toHaveBeenCalledWith(
    "/repo",
    expect.any(Function),
    expect.objectContaining({
      includeTestResults: false,
      includeTestResultsUnder: [],
      expandedDirectories: [],
    }),
  );
});

test("provides the default discovery configuration when options are omitted", () => {
  const inventory = createRepositoryInventory("/repo");

  expect(inventory).toMatchObject({ root: "/repo", focusedScope: null });
  expect(inventory.repositoryFiles).toEqual(expect.any(Function));
});
