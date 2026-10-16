import { expect, jest, test } from "@jest/globals";
import { platform } from "node:os";
import { posix, resolve } from "node:path";
import { createRepositoryInventory } from "../../../../../src/validation/shared/repository/create-repository/inventory.mjs";

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

test("excludes test-results from documentation views even when discovery includes them", async () => {
  const inventory = createRepositoryInventory("/repo", {
    includeTestResults: true,
    findEntries: async () => [
      { path: "README.md", type: "file" },
      { path: "test-results", type: "directory" },
      { path: "test-results/report.md", type: "file" },
    ],
  });
  await expect(inventory.documentationFiles()).resolves.toEqual(["README.md"]);
});

test("normalizes a relative repository root", () => {
  expect(createRepositoryInventory("relative-repository").root).toBe(
    resolve("relative-repository"),
  );
});

test("uses POSIX path rules for a simulated non-Windows host", () => {
  expect(createRepositoryInventory("relative-repository", {}, "linux").root).toBe(
    posix.resolve("relative-repository"),
  );
});

test.each([
  String.raw`C:\workspace\repo`,
  String.raw`\\server\share\repo`,
  String.raw`\\?\C:\workspace\repo`,
  String.raw`\\.\C:\workspace\repo`,
])("handles Windows absolute repository root %s only on Windows hosts", (root) => {
  if (platform() !== "win32") {
    expect(() => createRepositoryInventory(root)).toThrow(
      "Windows repository inventory roots require a Windows host.",
    );
    return;
  }
  expect(createRepositoryInventory(root).root).toBe(root);
});

test("rejects Windows roots for a simulated non-Windows host", () => {
  expect(() => createRepositoryInventory(String.raw`C:\workspace\repo`, {}, "linux")).toThrow(
    "Windows repository inventory roots require a Windows host.",
  );
  expect(createRepositoryInventory(String.raw`C:\workspace\repo`, {}, "win32").root).toBe(
    String.raw`C:\workspace\repo`,
  );
});

test.each([undefined, null, "", "  ", 7])("rejects invalid inventory root %p", (root) => {
  expect(() => createRepositoryInventory(root)).toThrow(
    "Repository inventory root must be a non-empty path string.",
  );
});

test("reads existing descendants beneath a pruned directory before full discovery", async () => {
  const root = "/repo";
  const directory = resolve(root, "dist", "reports");
  const findEntries = jest.fn(async () => [
    { path: "dist", type: "directory", depth: 1 },
    { path: "dist/reports", type: "directory", depth: 2 },
    { path: "dist/reports/report.json", type: "file", depth: 2 },
  ]);
  const inventory = createRepositoryInventory(root, { findEntries });
  await expect(inventory.directoryEntries(directory)).resolves.toMatchObject([
    { name: "report.json", path: "dist/reports/report.json" },
  ]);
  expect(findEntries).toHaveBeenCalledTimes(1);
});

test("refreshes scoped inventory after files change", async () => {
  const root = "/repo";
  const directory = resolve(root, "docs");
  const findEntries = jest
    .fn()
    .mockResolvedValueOnce([
      { path: "docs", type: "directory", depth: 1 },
      { path: "docs/old.md", type: "file", depth: 1 },
    ])
    .mockResolvedValueOnce([
      { path: "docs", type: "directory", depth: 1 },
      { path: "docs/new.md", type: "file", depth: 1 },
    ]);
  const inventory = createRepositoryInventory(root, { findEntries });
  await expect(inventory.directoryEntries(directory)).resolves.toContainEqual(
    expect.objectContaining({ name: "old.md", path: "docs/old.md" }),
  );
  const entries = await inventory.directoryEntries(directory);
  expect(entries).not.toContainEqual(expect.objectContaining({ path: "docs/old.md" }));
  expect(entries).toContainEqual(expect.objectContaining({ name: "new.md", path: "docs/new.md" }));
});
