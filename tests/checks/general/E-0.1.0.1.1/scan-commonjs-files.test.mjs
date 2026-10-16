import { expect, jest, test } from "@jest/globals";

const readdir = jest.fn();
const readFile = jest.fn();
const fileSystem = await import("node:fs/promises");

jest.unstable_mockModule("node:fs/promises", () => ({ ...fileSystem, readdir, readFile }));

const { scanCommonJsFiles } =
  await import("../../../../src/checks/general/E-0.1.0.1.1/scan-commonjs-files.mjs");

test("detects CommonJS extensions and syntax", async () => {
  const parseAst = async (_root, file) => {
    if (file === "syntax.mjs") throw new Error("bad syntax");
    return { type: "Identifier", name: "__dirname" };
  };
  const findings = await scanCommonJsFiles(
    "/repo",
    ["entry.cjs", "types.cts", "entry.jsx", "plain.txt", "code.mts", "code.js", "syntax.mjs"],
    parseAst,
  );
  expect(findings).toEqual([
    "entry.cjs: CommonJS module extension",
    "types.cts: CommonJS module extension",
    "entry.jsx: CommonJS identifier __dirname",
    "code.mts: CommonJS identifier __dirname",
    "code.js: CommonJS identifier __dirname",
    "syntax.mjs: invalid module syntax (bad syntax)",
  ]);
});

test("reads maintained modules from the mocked repository inventory", async () => {
  readdir.mockResolvedValue([{ name: "index.js", isDirectory: () => false, isFile: () => true }]);
  readFile.mockResolvedValue("const value = require('fs');\n");

  await expect(scanCommonJsFiles("/repo", null, null)).resolves.toContain("index.js: require()");
  expect(readFile).toHaveBeenCalledTimes(1);
});
