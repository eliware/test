import { expect, jest, test } from "@jest/globals";
import { createRepositoryDirectoryEntries } from "../../src/checks/create-repository-directory-entries.mjs";

const fileEntry = (name) => ({ name, isFile: () => true, isDirectory: () => false });
const directoryEntry = (name) => ({ name, isFile: () => false, isDirectory: () => true });

test("projects unexpanded directory entries from scoped inventory discovery", async () => {
  const readDirectory = jest.fn(async () => [fileEntry("entry.mjs")]);
  const entriesUnder = jest.fn(async () => [
    { path: "src", type: "directory" },
    { path: "src/entry.mjs", type: "file" },
  ]);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(),
    entriesUnder,
    readDirectory,
    hasFullDiscovery: () => false,
  });

  const children = await directoryEntries("/repo/src");
  expect(children).toEqual([
    {
      name: "entry.mjs",
      path: "src/entry.mjs",
      isFile: expect.any(Function),
      isDirectory: expect.any(Function),
    },
  ]);
  expect(children[0].isFile()).toBe(true);
  expect(children[0].isDirectory()).toBe(false);
  expect(entriesUnder).toHaveBeenCalledWith("/repo/src");
  expect(readDirectory).not.toHaveBeenCalled();

  const missingDirectoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(),
    entriesUnder: jest.fn(async () => []),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => false,
  });
  await expect(missingDirectoryEntries("/repo/missing")).rejects.toMatchObject({ code: "ENOENT" });
});

test("projects indexed root and directory records", async () => {
  const records = [
    { path: "README.md", type: "file", depth: 0 },
    { path: "src", type: "directory", depth: 1 },
    { path: "src/index.mjs", type: "file", depth: 1 },
  ];
  const discovery = jest.fn(async () => records);
  let discoveredRecords;
  const entries = jest.fn(() => (discoveredRecords ??= discovery()));
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries,
    entriesUnder: jest.fn(),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => true,
  });

  const rootEntries = await directoryEntries("/repo");
  expect(rootEntries.map(({ name }) => name)).toEqual(["README.md", "src"]);
  expect(rootEntries[0].isFile()).toBe(true);
  expect(rootEntries[1].isDirectory()).toBe(true);
  await expect(directoryEntries("/repo/src")).resolves.toMatchObject([
    { name: "index.mjs", path: "src/index.mjs" },
  ]);
  expect(discovery).toHaveBeenCalledTimes(1);
});

test("falls back to reading descendants of pruned directories", async () => {
  const records = [{ path: "dist", type: "directory", depth: 1 }];
  const readDirectory = jest.fn(async (directory) => {
    if (directory === "dist") return [directoryEntry("assets")];
    if (directory === "dist/assets") return [directoryEntry("images")];
    if (directory === "dist/assets/images") return [fileEntry("app.js")];
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => records),
    entriesUnder: jest.fn(),
    readDirectory,
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/dist")).resolves.toMatchObject([
    { name: "assets", path: "dist/assets" },
  ]);
  const assets = await directoryEntries("/repo/dist/assets");
  expect(assets).toMatchObject([{ name: "images", path: "dist/assets/images" }]);
  const images = await directoryEntries("/repo/dist/assets/images");
  expect(images).toMatchObject([{ name: "app.js", path: "dist/assets/images/app.js" }]);
  expect(images[0].isFile()).toBe(true);
  expect(images[0].isDirectory()).toBe(false);
  expect(readDirectory).toHaveBeenCalledTimes(3);
});

test("discovers a deep generated descendant when requested directly", async () => {
  const records = [{ path: "dist", type: "directory", depth: 1 }];
  const readDirectory = jest.fn(async (directory) => {
    if (directory === "dist/assets/images") return [fileEntry("app.js")];
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => records),
    entriesUnder: jest.fn(),
    readDirectory,
    hasFullDiscovery: () => true,
  });

  const images = await directoryEntries("/repo/dist/assets/images");
  expect(images).toMatchObject([{ name: "app.js", path: "dist/assets/images/app.js" }]);
  expect(readDirectory).toHaveBeenCalledWith("dist/assets/images");
});

test("builds nested paths while locating a generated descendant", async () => {
  const records = [
    { path: "src", type: "directory", depth: 1 },
    { path: "src/coverage", type: "directory", depth: 2 },
  ];
  const readDirectory = jest.fn(async () => [fileEntry("report.json")]);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => records),
    entriesUnder: jest.fn(),
    readDirectory,
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/src/coverage/reports")).resolves.toMatchObject([
    { name: "report.json", path: "src/coverage/reports/report.json" },
  ]);
  expect(readDirectory).toHaveBeenCalledWith("src/coverage/reports");
});

test("reuses the same fallback listing for repeated generated-directory reads", async () => {
  const records = [{ path: "dist", type: "directory", depth: 1 }];
  let listing = [fileEntry("initial.js")];
  const readDirectory = jest.fn(async () => listing);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => records),
    entriesUnder: jest.fn(),
    readDirectory,
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/dist/assets")).resolves.toMatchObject([
    { name: "initial.js", path: "dist/assets/initial.js" },
  ]);
  listing = [fileEntry("changed.js")];
  await expect(directoryEntries("/repo/dist/assets")).resolves.toMatchObject([
    { name: "initial.js", path: "dist/assets/initial.js" },
  ]);
  expect(readDirectory).toHaveBeenCalledTimes(1);
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
