import { expect, jest, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryAstCache } from "../../src/checks/create-repository-ast-cache.mjs";
import { scanCommonJsFiles } from "../../src/checks/general/E-0.1/E-0.1.20/scan-commonjs-files.mjs";
import { scanDependencyFiles } from "../../src/checks/general/E-0.1/E-0.1.20/scan-dependency-files.mjs";
import { validateMaintainedFileSyntax } from "../../src/checks/general/E-0.1/validate-maintained-file-syntax.mjs";

test("uses the default filesystem reader and Babel parser", async () => {
  const parseAst = createRepositoryAstCache();
  const first = await parseAst(".", "src/checks/create-repository-ast-cache.mjs", {
    sourceType: "module",
  });
  const second = await parseAst(".", "src/checks/create-repository-ast-cache.mjs", {
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

test("source analyzers share one parsed AST through the run cache", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ast-sharing-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "export const value = 1;\n");
  const parseSource = jest.fn(parse);
  const parseAst = createRepositoryAstCache({ parseSource });
  const files = ["src/module.mjs"];
  try {
    await scanDependencyFiles(root, [], new Set(), {}, files, parseAst);
    await expect(scanCommonJsFiles(root, files, parseAst)).resolves.toEqual([]);
    await expect(validateMaintainedFileSyntax(root, files, { parseAst })).resolves.toEqual([]);
    expect(parseSource).toHaveBeenCalledTimes(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
