import { expect, jest, test } from "@jest/globals";
import { createRepositoryInventory } from "../../src/checks/create-repository-inventory.mjs";

const records = [
  { path: "README.md", type: "file", depth: 0 },
  { path: "src/index.mjs", type: "file", depth: 1 },
  { path: "src/package.json", type: "file", depth: 1 },
  { path: "test-results/report.md", type: "file", depth: 1 },
  { path: "dist/bundle.mjs", type: "file", depth: 1 },
  { path: "src/generated/ignored.mjs", type: "file", depth: 2 },
  { path: "src/test-fixtures/fixture.mjs", type: "file", depth: 2 },
  { path: "src/snapshot.snap.mjs", type: "file", depth: 1 },
  { path: "src/other.ts", type: "file", depth: 1 },
];

test("shares one discovery across the filtered file views", async () => {
  const findEntries = jest.fn(async () => records);
  const inventory = createRepositoryInventory("/repo", { findEntries });

  await expect(inventory.files("all")).resolves.toContain("test-results/report.md");
  await expect(inventory.files()).resolves.toContain("README.md");
  await expect(inventory.repositoryFiles()).resolves.toEqual([
    "README.md",
    "src/index.mjs",
    "src/package.json",
    "src/generated/ignored.mjs",
    "src/test-fixtures/fixture.mjs",
    "src/snapshot.snap.mjs",
    "src/other.ts",
  ]);
  await expect(inventory.files("maintained")).resolves.toContain("README.md");
  await expect(inventory.files("source")).resolves.toContain("src/other.ts");
  await expect(inventory.files("coverageSource")).resolves.toEqual(["src/index.mjs"]);
  await expect(inventory.files("documentation")).resolves.toContain("test-results/report.md");
  await expect(inventory.files("json")).resolves.toContain("src/package.json");
  expect(await inventory.files("repository")).toBe(await inventory.files("repository"));
  await expect(inventory.repositoryFiles()).resolves.toContain("README.md");
  await expect(inventory.focusedFiles()).resolves.toContain("README.md");
  expect(findEntries).toHaveBeenCalledTimes(1);
  await expect(inventory.files("unknown")).rejects.toThrow("Unknown repository inventory view");
});

test("serves explicit focused paths and falls back to repository files", async () => {
  const focused = createRepositoryInventory("/repo", {
    focusedScope: { paths: ["src/index.mjs"] },
    findEntries: jest.fn(async () => records),
  });
  await expect(focused.files("focused")).resolves.toEqual(["src/index.mjs"]);
  await expect(focused.focusedFiles()).resolves.toEqual(["src/index.mjs"]);

  const unscoped = createRepositoryInventory("/repo", { findEntries: jest.fn(async () => records) });
  await expect(unscoped.files("focused")).resolves.toContain("README.md");
  const emptyScope = createRepositoryInventory("/repo", {
    focusedScope: {},
    findEntries: jest.fn(async () => records),
  });
  await expect(emptyScope.files("focused")).resolves.toContain("README.md");
  const nullPaths = createRepositoryInventory("/repo", {
    focusedScope: { paths: null },
    findEntries: jest.fn(async () => records),
  });
  await expect(nullPaths.files("focused")).resolves.toContain("README.md");
  const emptyPaths = createRepositoryInventory("/repo", {
    focusedScope: { paths: [] },
    findEntries: jest.fn(async () => records),
  });
  await expect(emptyPaths.files("focused")).resolves.toContain("README.md");
});

test("filters generated and fixture paths from the monolith source view", async () => {
  const inventory = createRepositoryInventory("/repo", {
    findEntries: jest.fn(async () => records),
  });

  await expect(inventory.files("monolithSource")).resolves.toEqual([
    "src/index.mjs",
  ]);
});
