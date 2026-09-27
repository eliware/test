import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
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

test("scans a requested subtree lazily and reuses directory reads in a full walk", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-inventory-subtree-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "other"), { recursive: true });
  await writeFile(join(root, "src", "entry.mjs"), "export const entry = true;\n");
  await writeFile(join(root, "other", "private.txt"), "private\n");
  const reads = new Map();
  const inventory = createRepositoryInventory(root, {
    readDirectory: async (directory, options) => {
      reads.set(directory, (reads.get(directory) ?? 0) + 1);
      return readdir(directory, options);
    },
  });

  await expect(inventory.entriesUnder(join(root, "src"))).resolves.toEqual([
    { path: "src", type: "directory", depth: 1 },
    { path: "src/entry.mjs", type: "file", depth: 1 },
  ]);
  expect(reads.has(root)).toBe(false);
  expect(reads.get(join(root, "src"))).toBe(1);
  await expect(inventory.entriesUnder(join(root, "src"))).resolves.toHaveLength(2);
  await expect(inventory.entriesUnder(root)).resolves.toEqual(await inventory.entries());
  await expect(inventory.entriesUnder()).resolves.toEqual(await inventory.entries());
  await expect(inventory.entries()).resolves.toContainEqual({
    path: "src/entry.mjs",
    type: "file",
    depth: 1,
  });
  expect(reads.get(root)).toBe(1);
  expect(reads.get(join(root, "src"))).toBe(1);
  await expect(inventory.entriesUnder(join(root, "..", "outside"))).rejects.toThrow(
    "inside the repository",
  );
  await rm(root, { recursive: true, force: true });
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
  const findEntries = jest.fn(async () => [{ path: "README.md", type: "file", depth: 0 }]);
  const inventory = createRepositoryInventory("/repo", {
    focusedScope: { paths: [] },
    findEntries,
  });

  await expect(inventory.focusedFiles()).resolves.toEqual(["README.md"]);
  expect(findEntries).toHaveBeenCalledTimes(1);
});
