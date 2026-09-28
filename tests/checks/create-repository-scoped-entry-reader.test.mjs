import { expect, jest, test } from "@jest/globals";
import { createRepositoryDiscovery } from "../../src/checks/create-repository-inventory-discovery.mjs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  await expect(discovery.entriesUnder("/repo/docs")).resolves.toEqual(records);
  expect(findEntries).toHaveBeenCalledWith("/repo", expect.any(Function), {
    includeTestResults: true,
    includeTestResultsUnder: ["docs"],
    expandedDirectories: ["docs"],
    scopeDirectory: "docs",
  });
});

test("prefers full results when full discovery starts during a scoped read", async () => {
  const scopedRecords = [{ path: "src/old.mjs", type: "file", depth: 2 }];
  const fullRecords = [
    { path: "src", type: "directory", depth: 1 },
    { path: "src/new.mjs", type: "file", depth: 2 },
  ];
  let resolveScoped;
  const findEntries = jest.fn((_root, _readDirectory, options) =>
    options.scopeDirectory
      ? new Promise((resolve) => {
          resolveScoped = resolve;
        })
      : Promise.resolve(fullRecords),
  );
  const discovery = createRepositoryDiscovery({
    root: "/repo",
    findEntries,
    readDirectory: async () => [],
  });
  const scopedRead = discovery.entriesUnder("/repo/src");

  await expect(discovery.entries()).resolves.toEqual(fullRecords);
  resolveScoped(scopedRecords);
  await expect(scopedRead).resolves.toEqual(fullRecords);
});

test("applies file filters to fresh full results after a concurrent scan", async () => {
  const scopedRecords = [
    { path: "src/old.mjs", type: "file", depth: 2 },
    { path: "src/old.txt", type: "file", depth: 2 },
  ];
  const fullRecords = [
    { path: "src", type: "directory", depth: 1 },
    { path: "src/new.mjs", type: "file", depth: 2 },
    { path: "src/new.txt", type: "file", depth: 2 },
  ];
  let resolveScoped;
  const findEntries = jest.fn((_root, _readDirectory, options) =>
    options.scopeDirectory
      ? new Promise((resolve) => {
          resolveScoped = resolve;
        })
      : Promise.resolve(fullRecords),
  );
  const discovery = createRepositoryDiscovery({
    root: "/repo",
    findEntries,
    readDirectory: async () => [],
  });
  const filteredRead = discovery.entriesUnder("/repo/src", (path) => path.endsWith(".mjs"));

  await expect(discovery.entries()).resolves.toEqual(fullRecords);
  resolveScoped(scopedRecords);
  await expect(filteredRead).resolves.toEqual([fullRecords[0], fullRecords[1]]);
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

test("filters scoped source files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discovery-filtered-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "kept.mjs"), "export {};\n");
  await writeFile(join(root, "src", "ignored.txt"), "text\n");
  const discovery = createRepositoryDiscovery({ root, readDirectory: readdir });

  try {
    await expect(
      discovery.entriesUnder(join(root, "src"), (path) => path.endsWith(".mjs")),
    ).resolves.toEqual([
      { path: "src", type: "directory", depth: 1 },
      { path: "src/kept.mjs", type: "file", depth: 1 },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("normalizes custom finder absolute paths before returning scoped records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discovery-absolute-paths-"));
  const records = [
    { path: join(root, "docs"), type: "directory", depth: 1 },
    { path: join(root, "docs", "guide.md"), type: "file", depth: 1 },
    { path: join(root, "private", "secret.md"), type: "file", depth: 2 },
  ];
  const discovery = createRepositoryDiscovery({
    root,
    findEntries: async () => records,
    readDirectory: readdir,
  });

  try {
    await expect(discovery.entriesUnder(join(root, "docs"))).resolves.toEqual([
      { path: "docs", type: "directory", depth: 1 },
      { path: "docs/guide.md", type: "file", depth: 1 },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applies test-results inclusion options during scoped discovery", async () => {
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
