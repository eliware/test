import { expect, test } from "@jest/globals";
import { hasDirectJavaScriptToolUse } from "../../../../../src/checks/general/E-0.1/E-0.1.3/has-direct-javascript-tool-use.mjs";

test("detects imported, re-exported, dynamic, and child-process tool use", () => {
  expect(hasDirectJavaScriptToolUse('import "jest";')).toBe(true);
  expect(hasDirectJavaScriptToolUse('export * from "oxlint";')).toBe(true);
  expect(hasDirectJavaScriptToolUse('export * from "node:child_process";')).toBe(false);
  expect(hasDirectJavaScriptToolUse('await import("prettier");')).toBe(true);
  expect(
    hasDirectJavaScriptToolUse(
      'import { execFileSync } from "node:child_process"; execFileSync("prettier", []);',
    ),
  ).toBe(true);
  expect(
    hasDirectJavaScriptToolUse(
      'import * as childProcess from "child_process"; childProcess.execSync("jest");',
    ),
  ).toBe(true);
});

test("ignores comments, strings, computed imports, and unrelated child-process calls", () => {
  expect(
    hasDirectJavaScriptToolUse(
      '// execFileSync("prettier")\nconst sample = \'import "jest"\'; await import(moduleName);',
    ),
  ).toBe(false);
  expect(
    hasDirectJavaScriptToolUse(
      'import { execFileSync, chdir } from "node:child_process"; execFileSync(); chdir(".");',
    ),
  ).toBe(false);
});

test("allows Jest's ESM API only when analyzing a test module", () => {
  const apiImport = 'import { expect, jest } from "@jest/globals";';
  expect(hasDirectJavaScriptToolUse(apiImport)).toBe(true);
  expect(hasDirectJavaScriptToolUse(apiImport, true)).toBe(false);
  expect(hasDirectJavaScriptToolUse('import "@jest/core";', true)).toBe(true);
});
