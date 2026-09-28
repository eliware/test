import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryDiscovery } from "../../src/checks/create-repository-inventory-discovery.mjs";

test("discovery defaults and custom finders support full and scoped results", async () => {
  const defaultReads = jest.fn(async () => []);
  const defaults = createRepositoryDiscovery({ root: "/repo", readDirectory: defaultReads });
  expect(defaults.hasFullDiscovery()).toBe(false);
  await expect(defaults.entries()).resolves.toEqual([]);
  expect(defaults.hasFullDiscovery()).toBe(true);
  expect(defaultReads).toHaveBeenCalledWith(expect.stringMatching(/repo$/u), {
    withFileTypes: true,
  });

  const records = [
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/guide.md", type: "file", depth: 1 },
  ];
  const findEntries = jest.fn(async () => records);
  const scoped = createRepositoryDiscovery({
    root: "/repo",
    findEntries,
    readDirectory: async () => [],
    expandedDirectories: ["docs"],
    includeTestResults: true,
    includeTestResultsUnder: ["docs"],
  });
  await expect(scoped.entriesUnder("/repo/docs")).resolves.toEqual(records);
  expect(findEntries).toHaveBeenCalledWith("/repo", expect.any(Function), {
    includeTestResults: true,
    includeTestResultsUnder: ["docs"],
    expandedDirectories: ["docs"],
    scopeDirectory: "docs",
  });

  const fullFinder = jest.fn(async () => records);
  const full = createRepositoryDiscovery({
    root: "/repo",
    findEntries: fullFinder,
    readDirectory: async () => [],
  });
  await expect(full.entries()).resolves.toEqual(records);
  await expect(full.entriesUnder("/repo")).resolves.toEqual(records);
  await expect(full.entriesUnder("/repo/docs")).resolves.toEqual(records);
  expect(fullFinder).toHaveBeenCalledTimes(1);

  const rootFinder = jest.fn(async () => records);
  const rootScoped = createRepositoryDiscovery({
    root: "/repo",
    findEntries: rootFinder,
    readDirectory: async () => [],
  });
  await expect(rootScoped.entriesUnder("/repo")).resolves.toEqual(records);
  expect(rootFinder).toHaveBeenCalledTimes(1);
  expect(rootFinder.mock.calls[0][2]).not.toHaveProperty("scopeDirectory");
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
    await expect(discovery.entriesUnder(root)).resolves.toEqual(await discovery.entries());
    await expect(discovery.entriesUnder()).resolves.toEqual(await discovery.entries());
    await expect(discovery.entriesUnder(join(root, "..", "outside"))).rejects.toThrow(
      "inside the repository",
    );
    expect(reads.get(root)).toBe(1);
    expect(reads.get(join(root, "src"))).toBe(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applies test-results inclusion options to directory discovery", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discovery-test-results-"));
  await mkdir(join(root, "docs", "test-results"), { recursive: true });
  await writeFile(join(root, "docs", "guide.md"), "guide\n");
  await writeFile(join(root, "docs", "test-results", "report.json"), "{}\n");

  try {
    const excluded = createRepositoryDiscovery({ root, readDirectory: readdir });
    await expect(excluded.entriesUnder(join(root, "docs"))).resolves.not.toContainEqual(
      expect.objectContaining({ path: "docs/test-results", type: "directory" }),
    );

    const included = createRepositoryDiscovery({
      root,
      readDirectory: readdir,
      includeTestResults: true,
    });
    await expect(included.entriesUnder(join(root, "docs"))).resolves.toContainEqual(
      expect.objectContaining({ path: "docs/test-results/report.json", type: "file" }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
