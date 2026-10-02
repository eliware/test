import { expect, jest, test } from "@jest/globals";
import { executeConventionChecks } from "../../src/orchestrators/execute-convention-checks.mjs";

test("executes selected checks in discovery order", async () => {
  const calls = [];
  const checks = ["E-0.1.4", "E-0.1.20.17", "E-0.1.20.19"].map((ruleId) => ({
    ruleId,
    run: async () => {
      calls.push(ruleId);
      return { ruleId, status: "pass", message: "" };
    },
  }));
  const results = await executeConventionChecks(checks, {}, new Set());
  expect(calls).toEqual(checks.map(({ ruleId }) => ruleId));
  expect(results).toEqual(checks.map(({ ruleId }) => ({ ruleId, status: "pass", message: "" })));
});

test("records a check failure and continues executing later checks", async () => {
  const calls = [];
  const results = await executeConventionChecks(
    [
      {
        ruleId: "E-0.1",
        run: async () => {
          calls.push("E-0.1");
          throw new Error("inspection failed");
        },
      },
      {
        ruleId: "E-2",
        run: async () => {
          calls.push("E-2");
          return { ruleId: "E-2", status: "pass", message: "" };
        },
      },
    ],
    {},
    new Set(),
  );
  expect(calls).toEqual(["E-0.1", "E-2"]);
  expect(results[0]).toMatchObject({ ruleId: "E-0.1", status: "fail" });
  expect(results[1]).toEqual({ ruleId: "E-2", status: "pass", message: "" });
});

test("executes selected non-deterministic checks", async () => {
  let calls = 0;
  const results = await executeConventionChecks(
    [
      {
        ruleId: "E-3",
        enforcementMode: "non-deterministic",
        run: async () => {
          calls += 1;
          return { ruleId: "E-3", status: "pass", message: "" };
        },
      },
    ],
    {},
    new Set(),
  );
  expect(calls).toBe(1);
  expect(results).toEqual([{ ruleId: "E-3", status: "pass", message: "" }]);
});

test("executes only required checks beneath advisory parents", async () => {
  const placeholderRuleIds = [
    "E-0.1.130.6",
    "E-0.1.130.7",
    "E-0.1.130.8",
    "E-0.1.130.9",
    "E-0.1.40.9",
    "E-0.1.40.10",
    "E-0.1.40.11",
    "E-0.1.40.18",
    "E-0.1.40.19",
    "A-0.1.90.0.2",
    "A-0.1.90.0.3",
    "A-0.1.90.0.4",
    "A-0.1.90.0.5",
    "A-0.1.90.2",
    "A-0.1.90.3",
    "A-0.1.110.0.2",
    "A-0.1.110.0.3",
  ];
  const placeholders = placeholderRuleIds.map((ruleId) => ({
    ruleId,
    applicability: "advisory-only",
    run: jest.fn(),
  }));
  const checks = [
    ...placeholders,
    { ruleId: "E-0.1.26", applicability: "advisory-only", run: jest.fn() },
    {
      ruleId: "A-0.1.26.0",
      parentRuleId: "E-0.1.26",
      run: async () => ({ ruleId: "A-0.1.26.0", status: "pass", message: "" }),
    },
  ];
  expect(placeholders.every(({ applicability }) => applicability === "advisory-only")).toBe(true);

  const results = await executeConventionChecks(checks, {}, new Set());

  expect(results.map(({ ruleId }) => ruleId)).toEqual(["A-0.1.26.0"]);
  expect(results[0].status).toBe("pass");
});
