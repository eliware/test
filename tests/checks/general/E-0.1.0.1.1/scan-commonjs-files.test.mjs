import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanCommonJsFiles } from "../../../../src/checks/general/E-0.1.0.1.1/scan-commonjs-files.mjs";

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

test("reads maintained module files when no inventory is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-cjs-"));
  try {
    await writeFile(join(root, "index.js"), "const value = require('fs');\n");
    await expect(scanCommonJsFiles(root, null, null)).resolves.toContain("index.js: require()");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
