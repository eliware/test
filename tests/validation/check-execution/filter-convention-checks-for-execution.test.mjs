import { expect, test } from "@jest/globals";
import { filterConventionChecksForExecution } from "../../../src/validation/check-execution/filter-convention-checks-for-execution.mjs";

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

test("an exemption preserves unrelated checks", () => {
  const exempted = check("E-0.1.4");
  const unrelated = check("E-0.1.20.17");
  expect(
    filterConventionChecksForExecution([exempted, unrelated], {}, new Set([exempted.ruleId])),
  ).toEqual([unrelated]);
});

test("keeps deterministic children executable beneath an advisory-only parent", () => {
  const parent = check("E-0.1.26", { applicability: "advisory-only" });
  const child = check("A-0.1.26.0", { parentRuleId: parent.ruleId });

  expect(filterConventionChecksForExecution([parent, child], {}, new Set())).toEqual([child]);
});

test("omits non-deterministic advisory checks instead of recording a pass", () => {
  const advisory = check("A-0.1.3.0", {
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
  const executable = check("E-0.1.14", { enforcementMode: "deterministic" });
  expect(filterConventionChecksForExecution([advisory, executable], {}, new Set())).toEqual([
    executable,
  ]);
});

test("selects the requested rule and does not omit nondeterministic checks", () => {
  const selected = check("E-0.1.20.17", { enforcementMode: "non-deterministic" });
  const checks = [check("E-0.1.4"), selected, check("E-0.1.20.19")];
  expect(
    filterConventionChecksForExecution(checks, { modeRuleId: selected.ruleId }, new Set()),
  ).toEqual([selected]);
});

test("does not require convention checks to run an available tool mode", () => {
  expect(filterConventionChecksForExecution([], { modeRuleId: "E-0.1.20.19" }, new Set())).toEqual(
    [],
  );
});
