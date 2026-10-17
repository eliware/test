import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { analyzeTestToolUse } from "../../../../../src/checks/application/E-0.1.4.1.3/analyze/test-tool-use.mjs";

function analyze(source, allowHarnessTools) {
  const program = parse(source, { sourceType: "unambiguous" }).program;
  return allowHarnessTools === undefined
    ? analyzeTestToolUse(program)
    : analyzeTestToolUse(program, allowHarnessTools);
}

test("detects test-runner imports and module loads", () => {
  expect(analyze('import "vitest";')).toBe(true);
  expect(analyze('const runner = "@jest/core"; require(runner);')).toBe(true);
  expect(analyze('import "node:fs";')).toBe(false);
});

test("detects runner commands from launcher calls", () => {
  expect(analyze('import { spawn } from "node:child_process"; spawn("node", ["--test"]);')).toBe(
    true,
  );
  expect(analyze('import { spawn } from "node:child_process"; spawn("node", ["--version"]);')).toBe(
    false,
  );
});

test("allows the harness instrumentation package only in harness mode", () => {
  expect(analyze('import "istanbul-lib-instrument";')).toBe(true);
  expect(analyze('import "istanbul-lib-instrument";', true)).toBe(false);
});
