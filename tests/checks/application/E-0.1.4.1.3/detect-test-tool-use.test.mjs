import { expect, test } from "@jest/globals";
import { detectTestToolUse } from "../../../../src/checks/application/E-0.1.4.1.3/detect-test-tool-use.mjs";

test("detects static, aliased, and computed runner imports", () => {
  expect(detectTestToolUse('import "vitest";')).toBe(true);
  expect(detectTestToolUse('const runner = "@vitest/runner"; import(runner);')).toBe(true);
  expect(detectTestToolUse('import("@jest/" + "core");')).toBe(true);
  expect(detectTestToolUse('let runner; runner = "@jest/core"; import(runner);')).toBe(true);
  expect(detectTestToolUse('const runner = "@jest/" + suffix; import(runner);')).toBe(false);
  expect(detectTestToolUse("import(`mocha`);")).toBe(true);
  expect(detectTestToolUse('import "@jest/globals";')).toBe(false);
  expect(detectTestToolUse('import "istanbul-lib-instrument";', true)).toBe(false);
  expect(detectTestToolUse('import "istanbul-lib-instrument";')).toBe(true);
});

test("detects test runner and coverage tools in executable calls", () => {
  expect(detectTestToolUse('require("jest-cli");')).toBe(true);
  expect(detectTestToolUse('const runner = "vitest"; spawn(runner, ["run"]);')).toBe(true);
  expect(
    detectTestToolUse(
      'import { spawn as launch } from "node:child_process"; launch("node", ["--test"]);',
    ),
  ).toBe(true);
});

test("ignores runner names in comments and non-executable text", () => {
  expect(detectTestToolUse('// vitest run\nconst message = "jest";')).toBe(false);
  expect(detectTestToolUse("invalid {")).toBe(true);
});

test("ignores ordinary module loads and non-test launcher commands", () => {
  expect(
    detectTestToolUse(
      'require("node:fs"); require(); require(unknownModule); import("./local.mjs");',
    ),
  ).toBe(false);
  expect(detectTestToolUse("import(unknownRunner);")).toBe(false);
  expect(
    detectTestToolUse('import { spawn } from "node:child_process"; spawn("node", ["--version"]);'),
  ).toBe(false);
});
