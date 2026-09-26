import { expect, jest, test } from "@jest/globals";
import { createRepositoryInventory } from "../../src/checks/create-repository-inventory.mjs";

test("wires the inventory facade to one lazy mode-scoped discovery", async () => {
  const findEntries = jest.fn(async () => [
    { path: "README.md", type: "file", depth: 0 },
    { path: "src", type: "directory", depth: 1 },
    { path: "src/index.mjs", type: "file", depth: 1 },
  ]);
  const inventory = createRepositoryInventory("/repo", {
    mode: "audit",
    modeRuleId: "E-0.1.20.19",
    findEntries,
  });

  expect(Object.isFrozen(inventory)).toBe(true);
  expect(inventory.root).toBe("/repo");
  expect(inventory.mode).toBe("audit");
  await expect(inventory.repositoryFiles()).resolves.toEqual(["README.md", "src/index.mjs"]);
  expect(findEntries).toHaveBeenCalledTimes(1);
  expect(createRepositoryInventory("/repo").mode).toBeNull();
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
