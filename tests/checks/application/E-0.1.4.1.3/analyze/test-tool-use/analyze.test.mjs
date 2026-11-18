import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import analyzeTestToolUseProgram from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/test-tool-use/analyze.mjs";
test("prepares and analyzes static runner strings", () => {
  const program = parse('const runner = "@jest/core"; require(runner);', {
    sourceType: "unambiguous",
  }).program;
  expect(analyzeTestToolUseProgram(program)).toBe(true);
});
