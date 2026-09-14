import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { findCommonJsUses, walk } from "../../../../../src/checks/general/E-1/E-1.20/find-commonjs-uses.mjs";

test("finds CommonJS syntax and extensions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-esm-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "require.mjs"), 'const value = require("value");\n');
  await writeFile(join(root, "src", "legacy.cjs"), "module.exports = {};\n");
  await expect(findCommonJsUses(root, {})).resolves.toEqual(
    expect.arrayContaining([
      "src/require.mjs: require()",
      "src/legacy.cjs: CommonJS module extension",
    ]),
  );
  await rm(root, { recursive: true, force: true });
});

test("ignores empty AST nodes and source-location metadata", () => {
  const findings = [];
  walk(null, findings, "src/example.mjs");
  walk({ loc: {}, start: 1, end: 2, child: null }, findings, "src/example.mjs");
  expect(findings).toEqual([]);
});

test("finds CommonJS exports, identifiers, import.meta require, invalid syntax, and package entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-esm-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "mixed.mjs"),
    "module.exports = {}; exports.value = 1; console.log(__dirname, __filename); import.meta.require(\"dep\");\n",
  );
  await writeFile(join(root, "src", "invalid.mjs"), "export {\n");
  await writeFile(join(root, "src", "clean.js"), "export const value = 1;\n");
  await expect(findCommonJsUses(root, { main: "./dist/index.cjs" })).resolves.toEqual(
    expect.arrayContaining([
      "src/mixed.mjs: CommonJS export",
      "src/mixed.mjs: CommonJS identifier __dirname",
      "src/mixed.mjs: CommonJS identifier __filename",
      "src/mixed.mjs: import.meta.require()",
      expect.stringContaining("src/invalid.mjs: invalid module syntax"),
      "package.json: CommonJS entrypoint or export",
    ]),
  );
  await rm(root, { recursive: true, force: true });
});

test("accepts a clean repository with no package metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-esm-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "clean.mjs"), "export const value = 1;\n");
  await expect(findCommonJsUses(root)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});
