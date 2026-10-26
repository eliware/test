import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findFilesystemApiViolations } from "../../../../../src/validation/harness/test-write-policy/scan/filesystem-apis.mjs";

test("finds mutation and temporary directory imports", () => {
  const ast = parse(
    'import { writeFile as save, mkdtemp } from "node:fs/promises"; import { tmpdir } from "node:os";',
    { sourceType: "unambiguous", plugins: ["jsx", "typescript"] },
  );
  expect(findFilesystemApiViolations(ast, "tests/example.test.mjs")).toHaveLength(3);
});

test("finds dynamic namespace calls and destructured bindings", () => {
  const ast = parse(
    [
      'const fs = await import("node:fs");',
      "fs.writeFile('file', 'text');",
      "const { mkdtemp } = require('node:fs/promises');",
      "mkdtemp('fixture');",
    ].join("\n"),
    { sourceType: "unambiguous", plugins: ["jsx", "typescript"] },
  );
  expect(findFilesystemApiViolations(ast, "tests/example.test.mjs")).toEqual([
    "tests/example.test.mjs:2 uses a test API that creates files or temporary directories: use of writeFile.",
    "tests/example.test.mjs:3 uses a test API that creates files or temporary directories: binding of mkdtemp.",
  ]);
});

test("finds writes through chained namespace aliases", () => {
  const ast = parse(
    [
      'import * as fs from "node:fs";',
      "const io = fs;",
      "const fileSystem = io;",
      "fileSystem.writeFileSync('file', 'text');",
    ].join("\n"),
    { sourceType: "unambiguous", plugins: ["jsx", "typescript"] },
  );
  expect(findFilesystemApiViolations(ast, "tests/example.test.mjs")).toEqual([
    "tests/example.test.mjs:4 uses a test API that creates files or temporary directories: use of writeFileSync.",
  ]);
});

test("allows read-only APIs and explicitly mocked modules", () => {
  const ast = parse(
    [
      'import { readFile } from "node:fs/promises";',
      'jest.mock("node:fs");',
      'const fs = await import("node:fs");',
      "fs.writeFile('fixture', 'text');",
    ].join("\n"),
    { sourceType: "unambiguous", plugins: ["jsx", "typescript"] },
  );
  expect(findFilesystemApiViolations(ast, "tests/example.test.mjs")).toEqual([]);
});
