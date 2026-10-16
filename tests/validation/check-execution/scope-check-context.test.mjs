import { expect, test } from "@jest/globals";
import { scopeCheckContext } from "../../../src/validation/check-execution/scope-check-context.mjs";

test("excludes matching paths from every repository inventory view", async () => {
  const entries = [
    { path: "docs/guide.md", type: "file" },
    { path: "infrastructure/cluster/secrets/token.yaml", type: "file" },
    { path: "infrastructure/cluster/config.yaml", type: "file" },
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

  const scoped = scopeCheckContext(context, ["infrastructure/**/secrets/**"]);

  const expectedEntries = [entries[0], entries[2]];
  const expectedPaths = expectedEntries.map(({ path }) => path);
  await expect(scoped.repositoryInventory.files("all")).resolves.toEqual(expectedPaths);
  await expect(scoped.repositoryInventory.repositoryFiles()).resolves.toEqual(expectedPaths);
  await expect(scoped.repositoryInventory.focusedFiles()).resolves.toEqual(expectedPaths);
  await expect(scoped.repositoryInventory.entries()).resolves.toEqual(expectedEntries);
  await expect(scoped.repositoryInventory.entriesUnder("infrastructure")).resolves.toEqual(
    expectedEntries,
  );
  await expect(scoped.repositoryInventory.directoryEntries("infrastructure")).resolves.toEqual(
    expectedEntries,
  );
  expect(scoped.repositoryFiles).toEqual(expectedPaths);
  expect(scoped.isPathExempt("infrastructure\\cluster\\secrets\\token.yaml")).toBe(true);
  expect(scoped.isPathExempt("docs/guide.md")).toBe(false);
  expect(context.repositoryFiles).toHaveLength(3);
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
  const scoped = scopeCheckContext({}, ["secrets/**"]);
  expect(scoped.repositoryInventory).toBeUndefined();
  expect(scoped.isPathExempt("secrets/token.yaml")).toBe(true);
});
