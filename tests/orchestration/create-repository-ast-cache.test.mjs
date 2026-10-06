import { expect, jest, test } from "@jest/globals";
import { createRepositoryAstCache } from "../../src/orchestration/create-repository-ast-cache.mjs";

test("uses the default filesystem reader and Babel parser", async () => {
  const parseAst = createRepositoryAstCache();
  const first = await parseAst(".", "src/orchestration/create-repository-ast-cache.mjs", {
    sourceType: "module",
  });
  const second = await parseAst(".", "src/orchestration/create-repository-ast-cache.mjs", {
    sourceType: "module",
  });

  expect(first).toBe(second);
  expect(first.type).toBe("File");
});

test("rejects outside paths even when source text is supplied", async () => {
  const parseSource = jest.fn();
  const parseAst = createRepositoryAstCache({ parseSource });

  await expect(
    parseAst("/repo", "../outside.mjs", { sourceType: "module" }, "export const value = 1;"),
  ).rejects.toThrow("AST source file must be inside the repository");
  expect(parseSource).not.toHaveBeenCalled();
});

test("bypasses caching for parser options it cannot canonicalize", async () => {
  const read = jest.fn().mockResolvedValue("const value = 1;");
  const parseSource = jest.fn((source, options) => ({ source, options }));
  const parseAst = createRepositoryAstCache({ read, parseSource });
  const options = [
    { plugins: new Map([["typescript", true]]) },
    { plugins: new Set(["typescript"]) },
  ];

  await parseAst(".", "src/example.ts", options[0]);
  await parseAst(".", "src/example.ts", options[1]);
  await parseAst(".", "src/example.ts", options[0], "supplied source");

  expect(read).toHaveBeenCalledTimes(2);
  expect(parseSource).toHaveBeenCalledTimes(3);
  expect(parseSource.mock.calls.slice(0, 2).map(([, value]) => value)).toEqual(options);
  expect(parseSource.mock.calls[2][0]).toBe("supplied source");
});

test("shares an in-flight source snapshot across uncacheable parser options", async () => {
  let resolveRead;
  const read = jest.fn(() => new Promise((resolve) => (resolveRead = resolve)));
  const parseSource = jest.fn((source, options) => ({ source, options }));
  const parseAst = createRepositoryAstCache({ read, parseSource });
  const firstOptions = { plugins: new Map([["typescript", true]]) };
  const secondOptions = { plugins: new Set(["typescript"]) };
  const first = parseAst("/repo", "src/example.ts", firstOptions);
  const second = parseAst("/repo", "src/example.ts", secondOptions);

  await new Promise((resolve) => setImmediate(resolve));
  resolveRead("one stable source snapshot");

  await expect(first).resolves.toEqual({
    source: "one stable source snapshot",
    options: firstOptions,
  });
  await expect(second).resolves.toEqual({
    source: "one stable source snapshot",
    options: secondOptions,
  });
  expect(read).toHaveBeenCalledTimes(1);
});

test("parses supplied snapshots without reusing the cached disk AST", async () => {
  const read = jest.fn().mockResolvedValue("export const value = 'disk';");
  const parseSource = jest.fn((source) => ({ source }));
  const parseAst = createRepositoryAstCache({ read, parseSource });
  const options = { sourceType: "module" };

  await parseAst("/repo", "src/example.mjs", options);
  await expect(
    parseAst("/repo", "src/example.mjs", options, "export const value = 'snapshot';"),
  ).resolves.toEqual({ source: "export const value = 'snapshot';" });

  expect(read).toHaveBeenCalledTimes(1);
  expect(parseSource).toHaveBeenCalledTimes(2);
});

test("parser options keep concurrent source reads in their own cache entries", async () => {
  let resolveFirstRead;
  const firstSource = new Promise((resolve) => {
    resolveFirstRead = resolve;
  });
  const read = jest
    .fn()
    .mockImplementationOnce(() => firstSource)
    .mockResolvedValueOnce("new");
  const parseSource = jest.fn((source, options) => ({ source, options }));
  const parseAst = createRepositoryAstCache({ read, parseSource });
  const moduleOptions = { sourceType: "module" };
  const scriptOptions = { sourceType: "unambiguous" };
  const moduleAst = parseAst(".", "src/example.mjs", moduleOptions);
  await new Promise((resolve) => setImmediate(resolve));
  const scriptAst = parseAst(".", "src/example.mjs", scriptOptions);

  await expect(scriptAst).resolves.toEqual({ source: "new", options: scriptOptions });
  resolveFirstRead("old");
  await expect(moduleAst).resolves.toEqual({ source: "old", options: moduleOptions });
  expect(read).toHaveBeenCalledTimes(2);
});
