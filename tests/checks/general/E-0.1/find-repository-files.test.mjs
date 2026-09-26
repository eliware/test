import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  findRepositoryEntries,
  findRepositoryFiles,
} from "../../../../src/checks/general/E-0.1/find-repository-files.mjs";

test("discovers repository files while excluding dependency and generated trees", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-repository-files-"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "README.md"), "readme");
  await writeFile(join(root, "node_modules", "ignored.txt"), "ignored");
  await expect(findRepositoryFiles(root)).resolves.toEqual(["README.md"]);
  await rm(root, { recursive: true, force: true });
});

test("recurses through included directories and ignores non-file entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-repository-files-nested-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await expect(
    findRepositoryFiles(root, async (directory) => {
      if (directory === root) {
        return [
          { name: "docs", isDirectory: () => true, isFile: () => false },
          { name: "special", isDirectory: () => false, isFile: () => false },
        ];
      }
      return [{ name: "guide.md", isDirectory: () => false, isFile: () => true }];
    }),
  ).resolves.toEqual(["docs/guide.md"]);
  await rm(root, { recursive: true, force: true });
});

test("returns directory depth metadata and can include test-results for documentation views", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-repository-entries-"));
  await mkdir(join(root, "test-results", "nested"), { recursive: true });
  await writeFile(join(root, "test-results", "nested", "report.md"), "report");

  await expect(findRepositoryEntries(root)).resolves.toEqual([]);
  await expect(findRepositoryEntries(root, undefined, { includeTestResults: true })).resolves.toEqual([
    { path: "test-results", type: "directory", depth: 1 },
    { path: "test-results/nested", type: "directory", depth: 2 },
    { path: "test-results/nested/report.md", type: "file", depth: 2 },
  ]);
  await expect(findRepositoryFiles(root)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("includes test-results only beneath requested inventory scopes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-scoped-test-results-"));
  await mkdir(join(root, "src", "test-results", "nested"), { recursive: true });
  await mkdir(join(root, "test-results"), { recursive: true });
  await writeFile(join(root, "src", "test-results", "nested", "report.json"), "{}");
  await writeFile(join(root, "test-results", "report.json"), "{}");

  await expect(findRepositoryEntries(root, undefined, { includeTestResultsUnder: ["src"] })).resolves.toEqual([
    { path: "src", type: "directory", depth: 1 },
    { path: "src/test-results", type: "directory", depth: 2 },
    { path: "src/test-results/nested", type: "directory", depth: 3 },
    { path: "src/test-results/nested/report.json", type: "file", depth: 3 },
  ]);
  await rm(root, { recursive: true, force: true });
});

test("walks a requested subtree and rejects scopes outside the repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-scoped-repository-entries-"));
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await expect(findRepositoryEntries(root, undefined, { scopeDirectory: "docs" })).resolves.toEqual([
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/guide.md", type: "file", depth: 1 },
  ]);
  await expect(findRepositoryEntries(root, undefined, { scopeDirectory: ".." })).rejects.toThrow(
    "inside the repository",
  );
  await expect(findRepositoryEntries(root, undefined, { scopeDirectory: "../outside" })).rejects.toThrow(
    "inside the repository",
  );
  await expect(findRepositoryEntries(root, undefined, { scopeDirectory: "C:/outside" })).rejects.toThrow(
    "inside the repository",
  );
  await rm(root, { recursive: true, force: true });
});

test("expands only explicitly selected generated subtrees", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-expanded-inventory-"));
  await mkdir(join(root, "docs", "build"), { recursive: true });
  await mkdir(join(root, "dist"), { recursive: true });
  await writeFile(join(root, "docs", "build", "index.md"), "generated docs");
  await writeFile(join(root, "dist", "bundle.js"), "bundle");

  await expect(findRepositoryEntries(root, undefined, { includeTestResults: true })).resolves.not.toContainEqual(
    expect.objectContaining({ path: "docs/build/index.md" }),
  );
  await expect(
    findRepositoryEntries(root, undefined, {
      includeTestResults: true,
      expandedDirectories: ["docs"],
    }),
  ).resolves.toContainEqual(expect.objectContaining({ path: "docs/build/index.md", type: "file" }));
  await expect(
    findRepositoryEntries(root, undefined, {
      includeTestResults: true,
      expandedDirectories: ["docs"],
    }),
  ).resolves.not.toContainEqual(expect.objectContaining({ path: "dist/bundle.js" }));
  await rm(root, { recursive: true, force: true });
});
