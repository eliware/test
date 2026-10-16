import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readdir = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readdir }));

const { findRepositoryEntries, findRepositoryFiles } =
  await import("../../../../src/validation/shared/repository/find-repository-files.mjs");

const root = "C:/repo";
const file = (name) => ({ name, isDirectory: () => false, isFile: () => true });
const directory = (name) => ({ name, isDirectory: () => true, isFile: () => false });

beforeEach(() => readdir.mockReset());

test("discovers repository files while excluding dependency and generated trees", async () => {
  readdir.mockResolvedValueOnce([directory("node_modules"), file("README.md")]);

  await expect(findRepositoryFiles(root)).resolves.toEqual(["README.md"]);
});

test("filters discovered files and reports accepted paths to the traversal observer", async () => {
  readdir.mockResolvedValueOnce([file("guide.md"), file("data.json")]);
  const observed = [];

  await expect(
    findRepositoryEntries(root, undefined, {
      fileFilter: (path) => path.endsWith(".md"),
      onFile: (path) => observed.push(path),
    }),
  ).resolves.toContainEqual({ path: "guide.md", type: "file", depth: 0 });
  expect(observed).toEqual(["guide.md"]);
});

test("recurses through included directories and ignores non-file entries", async () => {
  readdir.mockResolvedValueOnce([
    directory("docs"),
    { name: "special", isDirectory: () => false, isFile: () => false },
  ]);
  readdir.mockResolvedValueOnce([file("guide.md")]);

  await expect(findRepositoryFiles(root)).resolves.toEqual(["docs/guide.md"]);
});

test("returns directory depth metadata and can include test-results for documentation views", async () => {
  readdir.mockImplementation(async (path) => {
    if (path === root) return [directory("test-results")];
    if (path === join(root, "test-results")) return [directory("nested")];
    if (path === join(root, "test-results", "nested")) return [file("report.md")];
    return [];
  });
  await expect(findRepositoryEntries(root)).resolves.toEqual([]);
  await expect(
    findRepositoryEntries(root, undefined, { includeTestResults: true }),
  ).resolves.toEqual([
    { path: "test-results", type: "directory", depth: 1 },
    { path: "test-results/nested", type: "directory", depth: 2 },
    { path: "test-results/nested/report.md", type: "file", depth: 2 },
  ]);
});

test("includes test-results only beneath requested inventory scopes", async () => {
  readdir.mockResolvedValueOnce([directory("src"), directory("test-results")]);
  readdir.mockResolvedValueOnce([directory("test-results")]);
  readdir.mockResolvedValueOnce([directory("nested")]);
  readdir.mockResolvedValueOnce([file("report.json")]);

  await expect(
    findRepositoryEntries(root, undefined, { includeTestResultsUnder: ["src"] }),
  ).resolves.toContainEqual({
    path: "src/test-results/nested/report.json",
    type: "file",
    depth: 3,
  });
});

test("skips a direct test-results scope when the inventory does not include it", async () => {
  await expect(
    findRepositoryEntries(root, undefined, { scopeDirectory: "test-results" }),
  ).resolves.toEqual([]);
  expect(readdir).not.toHaveBeenCalled();
});

test("walks a nested test-results scope when its parent inventory is enabled", async () => {
  readdir.mockResolvedValueOnce([file("report.json")]);

  await expect(
    findRepositoryEntries(root, undefined, {
      includeTestResultsUnder: ["src"],
      scopeDirectory: "src/test-results/nested",
    }),
  ).resolves.toEqual([
    { path: "src/test-results/nested", type: "directory", depth: 3 },
    { path: "src/test-results/nested/report.json", type: "file", depth: 3 },
  ]);
});

test("walks a requested subtree and rejects scopes outside the repository", async () => {
  readdir.mockResolvedValueOnce([file("guide.md")]);

  await expect(findRepositoryEntries(root, undefined, { scopeDirectory: "docs" })).resolves.toEqual(
    [
      { path: "docs", type: "directory", depth: 1 },
      { path: "docs/guide.md", type: "file", depth: 1 },
    ],
  );
  await expect(findRepositoryEntries(root, undefined, { scopeDirectory: ".." })).rejects.toThrow(
    "inside the repository",
  );
  await expect(
    findRepositoryEntries(root, undefined, { scopeDirectory: "../outside" }),
  ).rejects.toThrow("inside the repository");
  await expect(
    findRepositoryEntries(root, undefined, { scopeDirectory: "C:/outside" }),
  ).rejects.toThrow("inside the repository");
});

test("enforces scoped depth before reading deeper directories", async () => {
  readdir.mockResolvedValueOnce([directory("nested")]);

  await expect(
    findRepositoryEntries(root, undefined, { scopeDirectory: "docs", maxDepth: 0 }),
  ).rejects.toThrow("depth limit");
  expect(readdir).toHaveBeenLastCalledWith(join(root, "docs"), { withFileTypes: true });
});

test("expands only explicitly selected generated subtrees", async () => {
  readdir.mockImplementation(async (path) => {
    if (path === root) return [directory("docs")];
    if (path === join(root, "docs")) return [directory("build")];
    if (path === join(root, "docs", "build")) return [file("index.md")];
    return [];
  });

  await expect(
    findRepositoryEntries(root, undefined, { expandedDirectories: ["docs"] }),
  ).resolves.toContainEqual({ path: "docs/build/index.md", type: "file", depth: 2 });
  expect(readdir).toHaveBeenCalledWith(join(root, "docs", "build"), { withFileTypes: true });
});
