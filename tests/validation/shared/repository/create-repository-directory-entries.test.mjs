import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryInventory } from "../../../../src/validation/shared/repository/create-repository-inventory.mjs";
import { createRepositoryDirectoryEntries } from "../../../../src/validation/shared/repository/create-repository-directory-entries.mjs";

const fileEntry = (name) => ({ name, isFile: () => true, isDirectory: () => false });

test("projects unexpanded directory entries from scoped inventory discovery", async () => {
  const entriesUnder = jest.fn(async () => [
    { path: "src", type: "directory" },
    { path: "src/entry.mjs", type: "file" },
  ]);
  const readDirectory = jest.fn();
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(),
    entriesUnder,
    readDirectory,
    hasFullDiscovery: () => false,
  });

  const traversal = { maxDepth: 7, includeGenerated: true };
  const scopedEntries = await directoryEntries("/repo/src", traversal);
  expect(scopedEntries).toMatchObject([{ name: "entry.mjs", path: "src/entry.mjs" }]);
  expect(scopedEntries[0].isFile()).toBe(true);
  expect(scopedEntries[0].isDirectory()).toBe(false);
  expect(entriesUnder).toHaveBeenCalledWith("/repo/src", null, traversal);
  expect(readDirectory).not.toHaveBeenCalled();
  await expect(directoryEntries("/repo/missing")).rejects.toMatchObject({ code: "ENOENT" });
});

test("reads existing descendants beneath a pruned directory before full discovery", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-pruned-scope-"));
  const directory = join(root, "dist", "reports");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "report.json"), "{}\n");
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
  const directory = join(root, "docs");
  await mkdir(directory);
  await writeFile(join(directory, "old.md"), "old\n");
  const inventory = createRepositoryInventory(root, { readDirectory: readdir });
  try {
    await expect(inventory.directoryEntries(directory)).resolves.toContainEqual(
      expect.objectContaining({ name: "old.md", path: "docs/old.md" }),
    );
    await unlink(join(directory, "old.md"));
    await writeFile(join(directory, "new.md"), "new\n");
    const entries = await inventory.directoryEntries(directory);
    expect(entries).not.toContainEqual(expect.objectContaining({ path: "docs/old.md" }));
    expect(entries).toContainEqual(
      expect.objectContaining({ name: "new.md", path: "docs/new.md" }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("projects indexed records and rebuilds the index when discovery changes", async () => {
  const initial = [
    { path: "README.md", type: "file" },
    { path: "src", type: "directory" },
    { path: "src/index.mjs", type: "file" },
  ];
  let current = initial;
  const discovery = jest.fn(async () => current);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: () => discovery(),
    entriesUnder: jest.fn(),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => true,
  });

  const rootEntries = await directoryEntries("/repo");
  expect(rootEntries).toMatchObject([
    { name: "README.md", path: "README.md" },
    { name: "src", path: "src" },
  ]);
  expect(rootEntries[0].isFile()).toBe(true);
  expect(rootEntries[1].isDirectory()).toBe(true);
  const sourceEntries = await directoryEntries("/repo/src");
  expect(sourceEntries).toMatchObject([{ name: "index.mjs", path: "src/index.mjs" }]);
  expect(sourceEntries[0].isFile()).toBe(true);
  expect(sourceEntries[0].isDirectory()).toBe(false);
  await expect(directoryEntries("/repo/src")).resolves.toBe(sourceEntries);
  current = [...initial, { path: "src/new.mjs", type: "file" }];
  await expect(directoryEntries("/repo/src")).resolves.toMatchObject([
    { name: "index.mjs", path: "src/index.mjs" },
    { name: "new.mjs", path: "src/new.mjs" },
  ]);
  expect(discovery).toHaveBeenCalledTimes(4);
});

test("reads direct descendants of discovered generated directories", async () => {
  const readDirectory = jest.fn(async () => [fileEntry("app.js")]);
  const statDirectory = jest.fn(async () => ({ isDirectory: () => true }));
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => [
      { path: "src", type: "directory" },
      { path: "src/coverage", type: "directory" },
    ]),
    entriesUnder: jest.fn(),
    readDirectory,
    statDirectory,
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/src/coverage/reports")).resolves.toMatchObject([
    { name: "app.js", path: "src/coverage/reports/app.js" },
  ]);
  expect(readDirectory).toHaveBeenCalledWith("src/coverage/reports");
  expect(statDirectory).toHaveBeenCalledWith(join("/repo", "src/coverage/reports"), {
    bigint: true,
  });
});

test("reads nested real directories beneath a pruned generated ancestor", async () => {
  const readDirectory = jest.fn(async () => [fileEntry("report.json")]);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => [{ path: "dist", type: "directory" }]),
    entriesUnder: jest.fn(),
    readDirectory,
    statDirectory: jest.fn(async () => ({ isDirectory: () => true })),
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/dist/reports/current")).resolves.toMatchObject([
    { name: "report.json", path: "dist/reports/current/report.json" },
  ]);
  expect(readDirectory).toHaveBeenCalledWith("dist/reports/current");
});

test("stats missing generated descendants and rejects them before readdir", async () => {
  const missingError = Object.assign(new Error("missing generated descendant"), { code: "ENOENT" });
  const readDirectory = jest.fn();
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => [{ path: "dist", type: "directory" }]),
    entriesUnder: jest.fn(),
    readDirectory,
    statDirectory: jest.fn(async () => {
      throw missingError;
    }),
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/dist/missing")).rejects.toBe(missingError);
  expect(readDirectory).not.toHaveBeenCalled();
});

test("stats file paths beneath a generated directory and rejects before readdir", async () => {
  const readDirectory = jest.fn();
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => [{ path: "dist", type: "directory" }]),
    entriesUnder: jest.fn(),
    readDirectory,
    statDirectory: jest.fn(async () => ({ isDirectory: () => false })),
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/dist/file.js")).rejects.toMatchObject({
    code: "ENOTDIR",
  });
  expect(readDirectory).not.toHaveBeenCalled();
});

test("rejects unknown and external directory paths", async () => {
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => []),
    entriesUnder: jest.fn(),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/missing")).rejects.toMatchObject({ code: "ENOENT" });
  await expect(directoryEntries("/outside")).rejects.toThrow("inside the repository");
});
