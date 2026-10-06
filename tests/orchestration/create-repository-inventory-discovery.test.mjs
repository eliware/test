import { expect, jest, test } from "@jest/globals";
import { createRepositoryDiscovery } from "../../src/orchestration/create-repository-inventory-discovery.mjs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("defaults to lazy discovery and uses a supplied finder for full scans", async () => {
  const defaultReads = jest.fn(async () => []);
  const defaults = createRepositoryDiscovery({
    root: "/repo",
    readDirectory: defaultReads,
    statDirectory: async () => ({ dev: 1n, ino: 2n, size: 0n, mtimeNs: 1n, ctimeNs: 1n }),
  });
  expect(defaults.hasFullDiscovery()).toBe(false);
  await expect(defaults.entries()).resolves.toEqual([]);
  expect(defaults.hasFullDiscovery()).toBe(true);
  expect(defaultReads).toHaveBeenCalledWith(expect.stringMatching(/repo$/u), {
    withFileTypes: true,
  });

  const records = [{ path: "docs", type: "directory", depth: 1 }];
  const findEntries = jest.fn(async () => records);
  const discovery = createRepositoryDiscovery({
    root: "/repo",
    findEntries,
    readDirectory: async () => [],
  });
  await expect(discovery.entries()).resolves.toEqual(records);
  await expect(discovery.entriesUnder("/repo/docs")).resolves.toEqual(records);
  await expect(discovery.entriesUnder("/repo")).resolves.toEqual(records);
  expect(findEntries).toHaveBeenCalledTimes(1);
});

test("applies configured options to custom scoped discovery", async () => {
  const records = [
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/guide.md", type: "file", depth: 1 },
  ];
  const findEntries = jest.fn(async () => records);
  const discovery = createRepositoryDiscovery({
    root: "/repo",
    findEntries,
    readDirectory: async () => [],
    expandedDirectories: ["docs"],
    includeTestResults: true,
    includeTestResultsUnder: ["docs"],
  });
  await expect(discovery.entriesUnder("/repo/docs")).resolves.toEqual(records);
  await expect(discovery.entriesUnder("/repo", (path) => path.endsWith(".md"))).resolves.toEqual(
    records,
  );
  expect(findEntries).toHaveBeenCalledWith("/repo", expect.any(Function), {
    includeTestResults: true,
    includeTestResultsUnder: ["docs"],
    expandedDirectories: ["docs"],
    scopeDirectory: "docs",
  });
});

test("refreshes full discovery when repository directories change on disk", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discovery-refresh-"));
  const discovery = createRepositoryDiscovery({ root, readDirectory: readdir });
  try {
    await expect(discovery.entries()).resolves.toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await writeFile(join(root, "added.mjs"), "export {};\n");
    await expect(discovery.entries()).resolves.toContainEqual(
      expect.objectContaining({ path: "added.mjs", type: "file" }),
    );

    await rm(join(root, "added.mjs"));
    await expect(discovery.entries()).resolves.not.toContainEqual(
      expect.objectContaining({ path: "added.mjs", type: "file" }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovers default-finder subtrees lazily and caches repeated scoped reads", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discovery-subtree-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "other"), { recursive: true });
  await writeFile(join(root, "src", "entry.mjs"), "export const entry = true;\n");
  await writeFile(join(root, "other", "private.txt"), "private\n");
  const reads = new Map();
  const discovery = createRepositoryDiscovery({
    root,
    readDirectory: async (directory, options) => {
      reads.set(directory, (reads.get(directory) ?? 0) + 1);
      return readdir(directory, options);
    },
  });
  try {
    await expect(discovery.entriesUnder(join(root, "src"))).resolves.toEqual([
      { path: "src", type: "directory", depth: 1 },
      { path: "src/entry.mjs", type: "file", depth: 1 },
    ]);
    expect(reads.has(root)).toBe(false);
    await expect(discovery.entriesUnder(join(root, "src"))).resolves.toHaveLength(2);
    expect(reads.get(join(root, "src"))).toBe(1);
    await expect(discovery.entriesUnder(root)).resolves.toEqual(await discovery.entries());
    await expect(discovery.entriesUnder()).resolves.toEqual(await discovery.entries());
    await expect(discovery.entriesUnder(join(root, "..", "outside"))).rejects.toThrow(
      "inside the repository",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
