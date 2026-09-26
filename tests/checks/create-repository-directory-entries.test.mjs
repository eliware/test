import { expect, jest, test } from "@jest/globals";
import { createRepositoryDirectoryEntries } from "../../src/checks/create-repository-directory-entries.mjs";

const fileEntry = (name) => ({ name, isFile: () => true, isDirectory: () => false });
const directoryEntry = (name) => ({ name, isFile: () => false, isDirectory: () => true });

test("projects an unexpanded directory directly through the cached reader", async () => {
  const readDirectory = jest.fn(async () => [fileEntry("entry.mjs")]);
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(),
    readDirectory,
    hasFullDiscovery: () => false,
  });

  const children = await directoryEntries("/repo/src");
  expect(children).toEqual([{ name: "entry.mjs", path: "src/entry.mjs", isFile: expect.any(Function), isDirectory: expect.any(Function) }]);
  expect(children[0].isFile()).toBe(true);
  expect(children[0].isDirectory()).toBe(false);
  expect(readDirectory).toHaveBeenCalledWith("src");
});

test("projects indexed root and directory records", async () => {
  const records = [
    { path: "README.md", type: "file", depth: 0 },
    { path: "src", type: "directory", depth: 1 },
    { path: "src/index.mjs", type: "file", depth: 1 },
  ];
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => records),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => true,
  });

  const rootEntries = await directoryEntries("/repo");
  expect(rootEntries.map(({ name }) => name)).toEqual(["README.md", "src"]);
  expect(rootEntries[0].isFile()).toBe(true);
  expect(rootEntries[1].isDirectory()).toBe(true);
  await expect(directoryEntries("/repo/src")).resolves.toMatchObject([{ name: "index.mjs", path: "src/index.mjs" }]);
});

test("falls back to reading descendants of pruned directories", async () => {
  const records = [{ path: "dist", type: "directory", depth: 1 }];
  const readDirectory = jest.fn(async (directory) => {
    if (directory === "dist") return [directoryEntry("assets")];
    if (directory === "dist/assets") return [fileEntry("app.js")];
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => records),
    readDirectory,
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/dist")).resolves.toMatchObject([{ name: "assets", path: "dist/assets" }]);
  const assets = await directoryEntries("/repo/dist/assets");
  expect(assets).toMatchObject([{ name: "app.js", path: "dist/assets/app.js" }]);
  expect(assets[0].isFile()).toBe(true);
  expect(assets[0].isDirectory()).toBe(false);
  expect(readDirectory).toHaveBeenCalledTimes(2);
});

test("rejects unknown and external directory paths", async () => {
  const directoryEntries = createRepositoryDirectoryEntries({
    root: "/repo",
    entries: jest.fn(async () => []),
    readDirectory: jest.fn(),
    hasFullDiscovery: () => true,
  });

  await expect(directoryEntries("/repo/missing")).rejects.toMatchObject({ code: "ENOENT" });
  await expect(directoryEntries("/outside")).rejects.toThrow("inside the repository");
});
