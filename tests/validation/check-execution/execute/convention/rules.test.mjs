import { expect, test } from "@jest/globals";
import { executeConventionRules } from "../../../../../src/validation/check-execution/execute/convention/rules.mjs";

const pass = (ruleId) => ({ ruleId, status: "pass", message: "" });
const makeCheck = (ruleId, calls, status = "pass") => ({
  ruleId,
  run: async () => {
    calls.push(ruleId);
    return { ruleId, status, message: status === "fail" ? "check failed" : "" };
  },
});

test("executes selected checks in discovery order", async () => {
  const calls = [];
  const checks = ["E-0.1.4", "E-0.1.20.17", "E-0.1.20.19"].map((id) => makeCheck(id, calls));
  const results = await executeConventionRules(checks, {}, new Set());
  expect(calls).toEqual(checks.map(({ ruleId }) => ruleId));
  expect(results).toEqual(checks.map(({ ruleId }) => pass(ruleId)));
});

test("passes rule-scoped paths to the matching check only", async () => {
  const calls = [];
  const checks = [
    {
      ruleId: "E-0.1.4",
      run: async (context) => {
        calls.push(["E-0.1.4", context.exemptPaths]);
        return pass("E-0.1.4");
      },
    },
    {
      ruleId: "E-0.1.5",
      run: async (context) => {
        calls.push(["E-0.1.5", context.exemptPaths]);
        return pass("E-0.1.5");
      },
    },
  ];
  await executeConventionRules(checks, {}, new Map([["E-0.1.4", ["README.md"]]]));
  expect(calls).toEqual([
    ["E-0.1.4", ["README.md"]],
    ["E-0.1.5", undefined],
  ]);
});

test("continues after a check returns a failure", async () => {
  const calls = [];
  const results = await executeConventionRules(
    [makeCheck("E-0.1", calls, "fail"), makeCheck("E-2", calls)],
    {},
    new Set(),
  );
  expect(calls).toEqual(["E-0.1", "E-2"]);
  expect(results.map(({ status }) => status)).toEqual(["fail", "pass"]);
});

test("executes selected non-deterministic checks", async () => {
  const nonDeterministic = makeCheck("E-3", []);
  nonDeterministic.enforcementMode = "non-deterministic";
  await expect(executeConventionRules([nonDeterministic], {}, new Set())).resolves.toEqual([
    pass("E-3"),
  ]);
});
