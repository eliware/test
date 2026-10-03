import { expect, jest, test } from "@jest/globals";
import { resolve } from "node:path";
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

test("normalizes a relative repository root", () => {
  expect(createRepositoryInventory("relative-repository").root).toBe(
    resolve("relative-repository"),
  );
});

test.each([
  String.raw`C:\workspace\repo`,
  String.raw`\\server\share\repo`,
  String.raw`\\?\C:\workspace\repo`,
  String.raw`\\.\C:\workspace\repo`,
])("preserves Windows absolute repository root %s independently of host paths", (root) => {
  expect(createRepositoryInventory(root).root).toBe(root);
});

test.each([undefined, null, "", "  ", 7])("rejects invalid inventory root %p", (root) => {
  expect(() => createRepositoryInventory(root)).toThrow(
    "Repository inventory root must be a non-empty path string.",
  );
});
