import { expect, test } from "@jest/globals";
import { filterConventionChecksForExecution } from "../../src/orchestrators/filter-convention-checks-for-execution.mjs";

const check = (ruleId, values = {}) => ({ ruleId, ...values });

test("filters advisory checks and checks beneath an exempted ancestor", () => {
  const checks = [
    check("E-0.1"),
    check("A-0.1.0", { parentRuleId: "E-0.1" }),
    check("E-2"),
    check("E-3", { applicability: "advisory-only" }),
  ];
  expect(filterConventionChecksForExecution(checks, {}, new Set(["E-0.1"]))).toEqual([checks[2]]);
});

test("selects the requested rule and does not omit nondeterministic checks", () => {
  const selected = check("E-0.1.20.17", { enforcementMode: "non-deterministic" });
  const checks = [check("E-0.1.4"), selected, check("E-0.1.20.19")];
  expect(
    filterConventionChecksForExecution(checks, { modeRuleId: selected.ruleId }, new Set()),
  ).toEqual([selected]);
});

test("rejects a requested mode without a selected check", () => {
  expect(() =>
    filterConventionChecksForExecution(
      [check("E-0.1.4")],
      { modeRuleId: "E-0.1.20.19" },
      new Set(),
    ),
  ).toThrow("is unavailable in the selected checks");
});
