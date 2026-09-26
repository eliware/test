import { expect, jest, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryAstCache } from "../../src/checks/create-repository-ast-cache.mjs";
import { scanCommonJsFiles } from "../../src/checks/general/E-0.1/E-0.1.20/scan-commonjs-files.mjs";
import { scanDependencyFiles } from "../../src/checks/general/E-0.1/E-0.1.20/scan-dependency-files.mjs";
import { validateMaintainedFileSyntax } from "../../src/checks/general/E-0.1/validate-maintained-file-syntax.mjs";

test("AST cache uses the default filesystem reader and Babel parser", async () => {
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

test("AST cache reads and parses a repository file once per parser configuration", async () => {
    const ast = { type: "File" };
    const read = jest.fn().mockResolvedValue("const value = 1;");
    const parseSource = jest.fn().mockReturnValue(ast);
    const parseAst = createRepositoryAstCache({ read, parseSource });
    const options = { sourceType: "unambiguous", plugins: ["typescript"] };

    const first = await parseAst(".", "src/example.ts", options);
    const second = await parseAst(".", "src/example.ts", options);

    expect(first).toBe(ast);
    expect(second).toBe(ast);
    expect(read).toHaveBeenCalledTimes(1);
    expect(parseSource).toHaveBeenCalledTimes(1);
});

test("AST cache does not share across different parser configurations", async () => {
    const read = jest.fn().mockResolvedValue("const value = 1;");
    const parseSource = jest.fn((source, options) => ({ source, options }));
    const parseAst = createRepositoryAstCache({ read, parseSource });

    await parseAst(".", "src/example.ts", { sourceType: "module" });
    await parseAst(".", "src/example.ts", { sourceType: "unambiguous" });

    expect(read).toHaveBeenCalledTimes(2);
    expect(parseSource).toHaveBeenCalledTimes(2);
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
