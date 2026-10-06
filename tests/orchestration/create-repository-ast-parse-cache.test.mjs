import { expect, jest, test } from "@jest/globals";
import { createRepositoryAstParseCache } from "../../src/orchestration/create-repository-ast-parse-cache.mjs";

test("reuses a parse while the repository source remains unchanged", async () => {
  const ast = { type: "File" };
  const parseSource = jest.fn().mockReturnValue(ast);
  const parseCachedSource = createRepositoryAstParseCache(parseSource);
  const getSource = jest.fn().mockResolvedValue("const value = 1;");

  await expect(parseCachedSource("key", getSource, {})).resolves.toBe(ast);
  await expect(parseCachedSource("key", getSource, {})).resolves.toBe(ast);
  expect(getSource).toHaveBeenCalledTimes(2);
  expect(parseSource).toHaveBeenCalledTimes(1);
});

test("reparses when the repository source changes", async () => {
  const parseSource = jest.fn((source) => ({ source }));
  const parseCachedSource = createRepositoryAstParseCache(parseSource);

  await expect(parseCachedSource("key", async () => "old", {})).resolves.toEqual({ source: "old" });
  await expect(parseCachedSource("key", async () => "new", {})).resolves.toEqual({ source: "new" });
  expect(parseSource).toHaveBeenCalledTimes(2);
});

test("an older rejected parse cannot evict a newer source snapshot", async () => {
  let rejectOlder;
  const olderParse = new Promise((_, reject) => {
    rejectOlder = reject;
  });
  const parseSource = jest.fn((source) => (source === "old" ? olderParse : { source }));
  const parseCachedSource = createRepositoryAstParseCache(parseSource);
  const older = parseCachedSource("key", async () => "old", {});
  await Promise.resolve();
  await Promise.resolve();
  const newer = parseCachedSource("key", async () => "new", {});

  await expect(newer).resolves.toEqual({ source: "new" });
  rejectOlder(new Error("obsolete parse"));
  await expect(older).rejects.toThrow("obsolete parse");
  await expect(parseCachedSource("key", async () => "new", {})).resolves.toEqual({ source: "new" });
  expect(parseSource).toHaveBeenCalledTimes(2);
});

test("an older read finishing last cannot replace the newer cached snapshot", async () => {
  let resolveOlderRead;
  const olderSource = new Promise((resolve) => {
    resolveOlderRead = resolve;
  });
  const parseSource = jest.fn((source) => ({ source }));
  const parseCachedSource = createRepositoryAstParseCache(parseSource);
  const older = parseCachedSource("key", () => olderSource, {});
  await Promise.resolve();
  const newer = parseCachedSource("key", async () => "new", {});

  await expect(newer).resolves.toEqual({ source: "new" });
  resolveOlderRead("old");
  // The older caller receives its own snapshot; later callers still reuse the newer cached parse.
  await expect(older).resolves.toEqual({ source: "old" });
  await expect(parseCachedSource("key", async () => "new", {})).resolves.toEqual({ source: "new" });
  expect(parseSource).toHaveBeenCalledTimes(2);
});

test("evicts a rejected parse so the same source can be retried", async () => {
  const parseSource = jest
    .fn()
    .mockRejectedValueOnce(new Error("temporary parse failure"))
    .mockReturnValue({ type: "File" });
  const parseCachedSource = createRepositoryAstParseCache(parseSource);
  const getSource = async () => "const value = 1;";

  await expect(parseCachedSource("key", getSource, {})).rejects.toThrow("temporary parse failure");
  await expect(parseCachedSource("key", getSource, {})).resolves.toEqual({ type: "File" });
  expect(parseSource).toHaveBeenCalledTimes(2);
});
