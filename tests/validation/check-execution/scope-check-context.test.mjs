import { expect, test } from "@jest/globals";
import { scopeCheckContext } from "../../../src/validation/check-execution/scope-check-context.mjs";

test("excludes exact paths from every repository inventory view", async () => {
  const entries = [
    { path: "docs/guide.md", type: "file" },
    { path: "docs/vendor.yml", type: "file" },
  ];
  const context = {
    repositoryFiles: entries.map(({ path }) => path),
    repositoryInventory: {
      files: async () => entries.map(({ path }) => path),
      repositoryFiles: async () => entries.map(({ path }) => path),
      focusedFiles: async () => entries.map(({ path }) => path),
      entries: async () => entries,
      entriesUnder: async () => entries,
      directoryEntries: async () => entries,
    },
  };

  const scoped = scopeCheckContext(context, ["docs/vendor.yml"]);

  await expect(scoped.repositoryInventory.files("all")).resolves.toEqual(["docs/guide.md"]);
  await expect(scoped.repositoryInventory.repositoryFiles()).resolves.toEqual(["docs/guide.md"]);
  await expect(scoped.repositoryInventory.focusedFiles()).resolves.toEqual(["docs/guide.md"]);
  await expect(scoped.repositoryInventory.entries()).resolves.toEqual([entries[0]]);
  await expect(scoped.repositoryInventory.entriesUnder("docs")).resolves.toEqual([entries[0]]);
  await expect(scoped.repositoryInventory.directoryEntries("docs")).resolves.toEqual([entries[0]]);
  expect(scoped.repositoryFiles).toEqual(["docs/guide.md"]);
  expect(scoped.isPathExempt("docs\\vendor.yml")).toBe(true);
  expect(scoped.isPathExempt("docs/guide.md")).toBe(false);
  expect(context.repositoryFiles).toHaveLength(2);
});

test("preserves the original context when no paths are exempt", () => {
  const context = { repositoryInventory: {} };
  expect(scopeCheckContext(context)).toBe(context);
});

test("scopes inventory paths when the context has no repository file list", async () => {
  const context = {
    repositoryInventory: {
      files: async () => [],
      repositoryFiles: async () => [],
      focusedFiles: async () => [],
      entries: async () => [],
      entriesUnder: async () => [],
      directoryEntries: async () => [],
    },
  };
  const scoped = scopeCheckContext(context, ["docs/vendor.yml"]);
  expect(scoped.repositoryFiles).toBeUndefined();
  await expect(scoped.repositoryInventory.repositoryFiles()).resolves.toEqual([]);
});

test("scopes checks without a repository inventory", () => {
  const scoped = scopeCheckContext({}, ["docs/vendor.yml"]);
  expect(scoped.repositoryInventory).toBeUndefined();
  expect(scoped.isPathExempt("docs/vendor.yml")).toBe(true);
});
