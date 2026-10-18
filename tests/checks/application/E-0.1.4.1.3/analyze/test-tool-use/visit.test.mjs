import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { visitTestToolUse } from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/test-tool-use/visit.mjs";
import { collectStaticStrings } from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/collect/static-strings.mjs";
import { collectLauncherAliases } from "../../../../../../src/checks/application/E-0.1.4.1.3/collect-launcher-aliases.mjs";

function visit(source, allowHarnessTools = false) {
  const program = parse(source, { sourceType: "unambiguous" }).program;
  return visitTestToolUse(
    program,
    collectStaticStrings(program),
    collectLauncherAliases(program),
    allowHarnessTools,
  );
}

test("detects runner imports and module loads during traversal", () => {
  expect(visit('import "vitest";')).toBe(true);
  expect(visit('const runner = "@jest/core"; require(runner);')).toBe(true);
  expect(visit('import "node:fs";')).toBe(false);
});

test("detects runner commands from launcher calls", () => {
  expect(visit('import { spawn } from "node:child_process"; spawn("node", ["--test"]);')).toBe(
    true,
  );
  expect(visit('import { spawn } from "node:child_process"; spawn("node", ["--version"]);')).toBe(
    false,
  );
});

test("allows harness instrumentation only when the harness flag is set", () => {
  expect(visit('import "istanbul-lib-instrument";')).toBe(true);
  expect(visit('import "istanbul-lib-instrument";', true)).toBe(false);
});
