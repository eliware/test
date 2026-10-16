import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { platform, tmpdir } from "node:os";
import { join, posix, resolve } from "node:path";
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
  const root = await mkdtemp(join(tmpdir(), "eliware-pruned-scope-"));
  const directory = resolve(root, "dist", "reports");
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "report.json"), "{}\n");
  const inventory = createRepositoryInventory(root, { readDirectory: readdir });
  try {
    await expect(inventory.directoryEntries(directory)).resolves.toMatchObject([
      { name: "report.json", path: "dist/reports/report.json" },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("refreshes scoped inventory after files change", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-scoped-refresh-"));
  const directory = resolve(root, "docs");
  await mkdir(directory);
  await writeFile(resolve(directory, "old.md"), "old\n");
  const inventory = createRepositoryInventory(root, { readDirectory: readdir });
  try {
    await expect(inventory.directoryEntries(directory)).resolves.toContainEqual(
      expect.objectContaining({ name: "old.md", path: "docs/old.md" }),
    );
    await unlink(resolve(directory, "old.md"));
    await writeFile(resolve(directory, "new.md"), "new\n");
    const entries = await inventory.directoryEntries(directory);
    expect(entries).not.toContainEqual(expect.objectContaining({ path: "docs/old.md" }));
    expect(entries).toContainEqual(
      expect.objectContaining({ name: "new.md", path: "docs/new.md" }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
