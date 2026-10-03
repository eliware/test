import { expect, test } from "@jest/globals";
import { findNpmignoreFiles } from "../../../../src/checks/npm-published/E-0.1.140/find-npmignore-files.mjs";

test("finds root and nested .npmignore files across path separators", () => {
  expect(findNpmignoreFiles([".npmignore", "src\\.npmignore", "README.md"])).toEqual([
    ".npmignore",
    "src\\.npmignore",
  ]);
});

test("ignores unrelated files and empty inventories", () => {
  expect(findNpmignoreFiles(["src/index.mjs", "docs/.npmignore.example"])).toEqual([]);
  expect(findNpmignoreFiles()).toEqual([]);
});
