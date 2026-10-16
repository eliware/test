import { expect, jest, test } from "@jest/globals";
import { createRepositoryDiscovery } from "../../../../../../src/validation/shared/repository/create-repository/inventory/discovery.mjs";
import { join } from "node:path";

test("forwards traversal limits and observers to a lazy scoped scan", async () => {
  const findEntries = jest.fn(async () => [{ path: "docs/guide.md", type: "file", depth: 1 }]);
  const discovery = createRepositoryDiscovery({ root: "/repo", findEntries });
  const onFile = jest.fn();
  await expect(
    discovery.entriesUnder("/repo/docs", null, { maxDepth: 2, onFile }),
  ).resolves.toEqual([{ path: "docs/guide.md", type: "file", depth: 1 }]);
  expect(findEntries).toHaveBeenCalledWith(
    "/repo",
    expect.any(Function),
    expect.objectContaining({ scopeDirectory: "docs", maxDepth: 2, onFile }),
  );
});

test("uses default options when discovery omits its finder", () => {
  const discovery = createRepositoryDiscovery({ root: "/repo" });
  expect(discovery.hasFullDiscovery()).toBe(false);
});

test("uses the default finder for a lazy scoped scan", async () => {
  const root = "/repo";
  const findEntries = jest.fn(async () => [
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/guide.md", type: "file", depth: 1 },
  ]);
  const discovery = createRepositoryDiscovery({ root, findEntries });
  await expect(discovery.entriesUnder(join(root, "docs"))).resolves.toHaveLength(2);
  await expect(discovery.entriesUnder(join(root, "docs"))).resolves.toHaveLength(2);
  expect(findEntries).toHaveBeenCalledTimes(2);
  expect(discovery.hasFullDiscovery()).toBe(false);
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
  const discovery = createRepositoryDiscovery({ root: "/repo", findEntries });
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
  const discovery = createRepositoryDiscovery({ root: "/repo", findEntries });
  const filteredRead = discovery.entriesUnder("/repo/src", (path) => path.endsWith(".mjs"));

  await expect(discovery.entries()).resolves.toEqual(fullRecords);
  resolveScoped(scopedRecords);
  await expect(filteredRead).resolves.toEqual([fullRecords[0], fullRecords[1]]);
});

test("filters a requested subtree after full discovery is cached", async () => {
  const records = [
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/guide.md", type: "file", depth: 1 },
    { path: "docs/data.json", type: "file", depth: 1 },
  ];
  const discovery = createRepositoryDiscovery({ root: "/repo", findEntries: async () => records });
  await discovery.entries();
  await expect(discovery.entriesUnder(undefined, undefined, undefined)).resolves.toEqual(records);
  await expect(discovery.entriesUnder("/repo")).resolves.toEqual(records);
  await expect(discovery.entriesUnder("/repo", (path) => path.endsWith(".md"))).resolves.toEqual(
    records.filter(({ path, type }) => type !== "file" || path.endsWith(".md")),
  );
  await expect(
    discovery.entriesUnder("/repo/docs", (path) => path.endsWith(".md")),
  ).resolves.toEqual([records[0], records[1]]);
});

test("filters scoped source files", async () => {
  const root = "/repo";
  const discovery = createRepositoryDiscovery({
    root,
    findEntries: async () => [
      { path: "src", type: "directory", depth: 1 },
      { path: "src/kept.mjs", type: "file", depth: 1 },
      { path: "src/ignored.txt", type: "file", depth: 1 },
    ],
  });
  await expect(
    discovery.entriesUnder(join(root, "src"), (path) => path.endsWith(".mjs")),
  ).resolves.toEqual([
    { path: "src", type: "directory", depth: 1 },
    { path: "src/kept.mjs", type: "file", depth: 1 },
  ]);
});

test("normalizes custom finder absolute paths before returning scoped records", async () => {
  const root = "C:/repo";
  const records = [
    { path: join(root, "docs"), type: "directory", depth: 1 },
    { path: join(root, "docs", "guide.md"), type: "file", depth: 1 },
    { path: join(root, "private", "secret.md"), type: "file", depth: 2 },
  ];
  const discovery = createRepositoryDiscovery({
    root,
    findEntries: async () => records,
  });
  await expect(discovery.entriesUnder(join(root, "docs"))).resolves.toEqual([
    { path: "docs", type: "directory", depth: 1 },
    { path: "docs/guide.md", type: "file", depth: 1 },
  ]);
});

test("applies test-results inclusion options during scoped discovery", async () => {
  const root = "/repo";
  const findEntries = jest.fn(async (_root, _readDirectory, options) => [
    { path: "docs", type: "directory", depth: 1 },
    ...("includeTestResults" in options && options.includeTestResults
      ? [
          { path: "docs/test-results", type: "directory", depth: 2 },
          { path: "docs/test-results/report.json", type: "file", depth: 2 },
        ]
      : []),
  ]);
  const excluded = createRepositoryDiscovery({ root, findEntries });
  await expect(excluded.entriesUnder(join(root, "docs"))).resolves.not.toContainEqual(
    expect.objectContaining({ path: "docs/test-results", type: "directory" }),
  );
  const included = createRepositoryDiscovery({ root, findEntries, includeTestResults: true });
  await expect(included.entriesUnder(join(root, "docs"))).resolves.toContainEqual(
    expect.objectContaining({ path: "docs/test-results/report.json", type: "file" }),
  );
});
