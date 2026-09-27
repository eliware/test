import { expect, jest, test } from "@jest/globals";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryInventory } from "../../src/checks/create-repository-inventory.mjs";

test("wires the inventory facade to one lazy repository discovery", async () => {
  const findEntries = jest.fn(async () => [
    { path: "README.md", type: "file", depth: 0 },
    { path: "src", type: "directory", depth: 1 },
    { path: "src/index.mjs", type: "file", depth: 1 },
  ]);
  const inventory = createRepositoryInventory("/repo", {
    findEntries,
  });

  expect(Object.isFrozen(inventory)).toBe(true);
  expect(inventory.root).toBe("/repo");
  await expect(inventory.repositoryFiles()).resolves.toEqual(["README.md", "src/index.mjs"]);
  expect(findEntries).toHaveBeenCalledTimes(1);
  expect(findEntries).toHaveBeenCalledWith("/repo", expect.any(Function), expect.objectContaining({
    includeTestResults: false,
    includeTestResultsUnder: [],
    expandedDirectories: [],
  }));
});

test("uses default repository discovery when no custom finder is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-inventory-default-"));
  try {
    const inventory = createRepositoryInventory(root);
    await expect(inventory.repositoryFiles()).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("serves focused paths without discovering unrelated repository files", async () => {
  const findEntries = jest.fn(async () => []);
  const focusedScope = { paths: ["tests/one.test.mjs"] };
  const inventory = createRepositoryInventory("/repo", { focusedScope, findEntries });

  await expect(inventory.focusedFiles()).resolves.toEqual(focusedScope.paths);
  expect(findEntries).not.toHaveBeenCalled();
});

test("falls back to the repository view when a focused scope has no paths", async () => {
  const findEntries = jest.fn(async () => [
    { path: "README.md", type: "file", depth: 0 },
  ]);
  const inventory = createRepositoryInventory("/repo", {
    focusedScope: { paths: [] },
    findEntries,
  });

  await expect(inventory.focusedFiles()).resolves.toEqual(["README.md"]);
  expect(findEntries).toHaveBeenCalledTimes(1);
});
