import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryInventory } from "../../src/checks/create-repository-inventory.mjs";

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
];

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

test("allows generated documentation only when requested", async () => {
  const inventory = createRepositoryInventory("/repo", {
    findEntries: jest.fn(async () => records),
  });

  await expect(inventory.documentationFiles({ directory: "/repo/docs" })).resolves.not.toContain(
    "build/index.md",
  );
  await expect(
    inventory.documentationFiles({
      directory: "/repo/docs",
      includeGenerated: true,
    }),
  ).resolves.toContain("build/index.md");
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
    options.onFile("docs/index.md");
    options.onFile("docs/other.md");
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

test("keeps generated files out of scoped depth and result limits unless included", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-documentation-limits-"));
  await mkdir(join(root, "docs", "build", "nested"), { recursive: true });
  await writeFile(join(root, "docs", "build", "nested", "index.md"), "generated");
  try {
    const included = createRepositoryInventory(root, {
      readDirectory: readdir,
      expandedDirectories: ["docs"],
    });
    await expect(
      included.documentationFiles({ directory: join(root, "docs"), includeGenerated: true }),
    ).resolves.toEqual(["build/nested/index.md"]);
    const excluded = createRepositoryInventory(root, {
      readDirectory: readdir,
      expandedDirectories: ["docs"],
    });
    await expect(
      excluded.documentationFiles({
        directory: join(root, "docs"),
        maxDepth: 0,
        maxFiles: 0,
      }),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports documentation predicate failures with the affected file name", async () => {
  const inventory = createRepositoryInventory("/repo", {
    findEntries: async (_root, _readDirectory, options) => {
      options.onFile("docs/README.md");
      return records;
    },
  });

  await expect(
    createRepositoryInventory("/repo", {
      findEntries: async (_root, _readDirectory, options) => {
        options.onFile("docs/README.md");
        return records;
      },
    }).documentationFiles({
      directory: "/repo/docs",
      predicate: () => {
        throw new Error("bad predicate");
      },
    }),
  ).rejects.toThrow('Documentation filename predicate failed for "README.md": bad predicate');
  await expect(
    inventory.documentationFiles({
      directory: "/repo/docs",
      predicate: () => {
        throw Symbol("invalid predicate");
      },
    }),
  ).rejects.toThrow(
    'Documentation filename predicate failed for "README.md": Symbol(invalid predicate)',
  );
});
