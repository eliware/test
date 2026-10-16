import { expect, jest, test } from "@jest/globals";
import { createRepositoryInventory } from "../../../../../../src/validation/shared/repository/create-repository/inventory.mjs";
import { createDocumentationFileView } from "../../../../../../src/validation/shared/repository/create-repository/inventory/documentation.mjs";

const records = [
  { path: "README.md", type: "file", depth: 0 },
  { path: "examples", type: "directory", depth: 1 },
  { path: "docs", type: "directory", depth: 1 },
  { path: "docs/index.md", type: "file", depth: 1 },
  { path: "docs/record.json", type: "file", depth: 1 },
  { path: "docs/nested", type: "directory", depth: 2 },
  { path: "docs/nested/record.json", type: "file", depth: 2 },
  { path: "docs/build", type: "directory", depth: 2 },
  { path: "docs/build/index.md", type: "file", depth: 2 },
  { path: "docs/node_modules", type: "directory", depth: 2 },
  { path: "docs/node_modules/dependency.md", type: "file", depth: 2 },
];

test("builds a documentation view directly from scoped entries", async () => {
  const documentationFiles = createDocumentationFileView("/repo", async () => [
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/guide.md", type: "file", depth: 1 },
  ]);
  await expect(documentationFiles({ directory: "/repo/docs" })).resolves.toEqual(["guide.md"]);
});

test("uses traversal callbacks to select files and skip excluded paths", async () => {
  const findEntries = jest.fn(async (_root, _readDirectory, options) => {
    options.onFile("docs/guide.md");
    options.onFile("docs/notes.txt");
    options.onFile("docs/build/generated.md");
    options.onFile("docs/node_modules/dependency.md");
    return [
      { path: "docs", type: "directory", depth: 1 },
      { path: "docs/guide.md", type: "file", depth: 1 },
      { path: "docs/notes.txt", type: "file", depth: 1 },
      { path: "docs/build", type: "directory", depth: 2 },
      { path: "docs/build/generated.md", type: "file", depth: 2 },
      { path: "docs/node_modules", type: "directory", depth: 2 },
      { path: "docs/node_modules/dependency.md", type: "file", depth: 2 },
    ];
  });
  const inventory = createRepositoryInventory("/repo", { findEntries });

  await expect(inventory.documentationFiles({ directory: "/repo/docs" })).resolves.toEqual([
    "guide.md",
    "notes.txt",
  ]);
});

test("shares scoped documentation discovery and enforces traversal limits", async () => {
  const findEntries = jest.fn(async () => records);
  const inventory = createRepositoryInventory("/repo", { findEntries });

  await expect(inventory.documentationFiles({ directory: "/repo/docs" })).resolves.toEqual([
    "index.md",
    "record.json",
    "nested/record.json",
  ]);
  await expect(inventory.documentationFiles()).resolves.toContain("README.md");
  await expect(
    inventory.documentationFiles({
      directory: "/repo",
      predicate: (name) => name === "README.md",
    }),
  ).resolves.toEqual(["README.md"]);
  await expect(
    inventory.documentationFiles({
      directory: "/repo/docs",
      predicate: (name) => name.endsWith(".json"),
      maxFiles: 1,
    }),
  ).rejects.toThrow("file limit");
  await expect(
    inventory.documentationFiles({
      directory: "/repo/docs",
      predicate: (name) => name.endsWith(".json"),
      maxFiles: 2,
    }),
  ).resolves.toEqual(["record.json", "nested/record.json"]);
  await expect(
    inventory.documentationFiles({ directory: "/repo/docs", maxDepth: 0 }),
  ).rejects.toThrow("depth limit");
  await expect(inventory.documentationFiles({ directory: "/repo/missing" })).rejects.toMatchObject({
    code: "ENOENT",
  });
  await expect(inventory.documentationFiles({ directory: "/outside" })).rejects.toThrow(
    "inside the repository",
  );
  expect(findEntries).toHaveBeenCalledTimes(2);
});

test("measures documentation depth relative to a deeply nested requested scope", async () => {
  const nested = [
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/one", type: "directory", depth: 2 },
    { path: "docs/one/two", type: "directory", depth: 3 },
    { path: "docs/one/two/three", type: "directory", depth: 4 },
    { path: "docs/one/two/three/file.md", type: "file", depth: 4 },
  ];
  const inventory = createRepositoryInventory("/repo", {
    findEntries: jest.fn(async () => nested),
  });
  await expect(
    inventory.documentationFiles({
      directory: "/repo/docs/one/two",
      maxDepth: 0,
    }),
  ).rejects.toThrow("depth limit");
  await expect(
    inventory.documentationFiles({
      directory: "/repo/docs/one/two",
      maxDepth: 1,
    }),
  ).resolves.toEqual(["three/file.md"]);
});

test("enforces traversal depth for files even when ancestor directory entries are missing", async () => {
  const inventory = createRepositoryInventory("/repo", {
    findEntries: jest.fn(async () => [
      { path: "docs", type: "directory", depth: 1 },
      { path: "docs/one/two/file.md", type: "file", depth: 4 },
    ]),
  });
  await expect(
    inventory.documentationFiles({ directory: "/repo/docs", maxDepth: 1 }),
  ).rejects.toThrow("depth limit");
});

test("applies depth and matching-file limits during lazy repository traversal", async () => {
  const findEntries = jest.fn(async (_root, _readDirectory, options) => {
    options.maxDepthFilter("docs/index.md");
    options.maxDepthFilter("docs/build/index.md");
    options.maxDepthFilter("docs/node_modules/dependency.md");
    options.onFile("docs/index.md");
    options.onFile("docs/other.md");
    options.onFile("docs/build/index.md");
    options.onFile("docs/node_modules/dependency.md");
    return records;
  });
  const inventory = createRepositoryInventory("/repo", { findEntries });
  await expect(
    inventory.documentationFiles({ directory: "/repo/docs", maxDepth: 3, maxFiles: 1 }),
  ).rejects.toThrow("file limit");
  expect(findEntries).toHaveBeenCalledWith(
    "/repo",
    expect.any(Function),
    expect.objectContaining({ maxDepth: 3, scopeDirectory: "docs", onFile: expect.any(Function) }),
  );
});

test("enforces result limits when traversal does not report file callbacks", async () => {
  const inventory = createRepositoryInventory("/repo", {
    findEntries: jest.fn(async () => records),
  });
  await expect(
    inventory.documentationFiles({ directory: "/repo/docs", maxFiles: 1 }),
  ).rejects.toThrow("file limit");
});

test("bounds lazy traversal by all non-generated files, including predicate misses", async () => {
  const inventory = createRepositoryInventory("/repo", {
    findEntries: jest.fn(async (_root, _readDirectory, options) => {
      options.onFile("docs/one.json");
      options.onFile("docs/two.json");
      return records;
    }),
  });
  await expect(
    inventory.documentationFiles({
      directory: "/repo/docs",
      predicate: (name) => name.endsWith(".md"),
      maxFiles: 1,
    }),
  ).rejects.toThrow("file limit");
});

test("keeps generated files out of scoped depth and result limits unless included", async () => {
  const root = "/repo";
  const included = createRepositoryInventory(root, { findEntries: async () => records });
  await expect(
    included.documentationFiles({ directory: `${root}/docs`, includeGenerated: true }),
  ).resolves.toEqual(["index.md", "record.json", "nested/record.json", "build/index.md"]);
  const excluded = createRepositoryInventory(root, { findEntries: async () => records });
  await expect(excluded.documentationFiles({ directory: `${root}/docs` })).resolves.toEqual([
    "index.md",
    "record.json",
    "nested/record.json",
  ]);
});
