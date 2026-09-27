import { expect, test } from "@jest/globals";
import { selectExecutionChecks } from "../../src/orchestrators/select-execution-checks.mjs";

test("keeps all checks for aggregate runs", () => {
  const checks = [{ ruleId: "E-0.1.1" }, { ruleId: "E-0.1.2", focusedSafe: false }];
  expect(selectExecutionChecks(checks, null)).toBe(checks);
});

test("keeps only focused-safe checks for a focused run", () => {
  const focused = { ruleId: "E-0.1.1", focusedSafe: true };
  expect(
    selectExecutionChecks(
      [focused, { ruleId: "E-0.1.2" }, { ruleId: "E-0.1.3", focusedSafe: false }],
      {},
    ),
  ).toEqual([focused]);
});
