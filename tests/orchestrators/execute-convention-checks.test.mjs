import { expect, jest, test } from "@jest/globals";
import { executeConventionChecks } from "../../src/orchestrators/execute-convention-checks.mjs";

test("skips an exempted parent and all descendants", async () => {
  const calls = [];
  const checks = [
    {
      ruleId: "E-1",
      run: async () => {
        calls.push("parent");
        return { ruleId: "E-1", status: "pass", message: "" };
      },
    },
    {
      ruleId: "A-1.0",
      parentRuleId: "E-1",
      run: async () => {
        calls.push("child");
        return { ruleId: "A-1.0", status: "pass", message: "" };
      },
    },
    {
      ruleId: "E-2",
      run: async () => {
        calls.push("other");
        return { ruleId: "E-2", status: "pass", message: "" };
      },
    },
  ];
  const results = await executeConventionChecks(checks, {}, new Set(["E-1"]));
  expect(calls).toEqual(["other"]);
  expect(results).toEqual([{ ruleId: "E-2", status: "pass", message: "" }]);
});

test("rejects a check result with the wrong identity", async () => {
  await expect(
    executeConventionChecks(
      [{ ruleId: "E-1", run: async () => ({ ruleId: "E-2", status: "pass", message: "" }) }],
      {},
      new Set(),
    ),
  ).rejects.toThrow("invalid result");
});

test("rejects an incomplete selected check before execution", async () => {
  await expect(executeConventionChecks([{ ruleId: "E-1.99" }], {}, new Set())).rejects.toThrow(
    "Selected check E-1.99 is incomplete",
  );
});

test("runs only the selected operational check for an explicit mode", async () => {
  const calls = [];
  const checks = ["E-1.4", "E-1.20.17", "E-1.20.19"].map((ruleId) => ({
    ruleId,
    run: async () => {
      calls.push(ruleId);
      return { ruleId, status: "pass", message: "" };
    },
  }));
  await expect(executeConventionChecks(checks, { modeRuleId: "E-1.20.17" }, new Set())).resolves.toEqual([
    { ruleId: "E-1.20.17", status: "pass", message: "" },
  ]);
  expect(calls).toEqual(["E-1.20.17"]);
});

test("fails when an explicit mode has no selected owner", async () => {
  await expect(executeConventionChecks(
    [{ ruleId: "E-1.4", run: async () => ({ ruleId: "E-1.4", status: "pass", message: "" }) }],
    { modeRuleId: "E-1.20.19" },
    new Set(),
  )).rejects.toThrow("is unavailable in the selected checks");
});

test("executes selected non-deterministic checks instead of silently skipping them", async () => {
  let calls = 0;
  const run = async () => {
    calls += 1;
    return { ruleId: "E-3", status: "pass", message: "" };
  };
  const results = await executeConventionChecks(
    [{ ruleId: "E-3", enforcementMode: "non-deterministic", run }],
    {},
    new Set(),
  );
  expect(calls).toBe(1);
  expect(results).toEqual([{ ruleId: "E-3", status: "pass", message: "" }]);
});

test("does not execute advisory-only placeholder checks", async () => {
  const run = jest.fn();
  const results = await executeConventionChecks(
    [{ ruleId: "E-1.20.3", applicability: "advisory-only", run }],
    {},
    new Set(),
  );
  expect(run).not.toHaveBeenCalled();
  expect(results).toEqual([]);
});

test("reports timing through start and end callbacks", async () => {
  const timing = { start: jest.fn(), end: jest.fn() };
  await executeConventionChecks(
    [{ ruleId: "E-4", run: async () => ({ ruleId: "E-4", status: "pass", message: "" }) }],
    { timing },
    new Set(),
  );
  expect(timing.start).toHaveBeenCalledWith("E-4");
  expect(timing.end).toHaveBeenCalledWith("E-4");
});

test("does not require timing when the current timer is unavailable", async () => {
  const timing = {};
  await executeConventionChecks(
    [{ ruleId: "E-5", run: async () => ({ ruleId: "E-5", status: "pass", message: "" }) }],
    { timing },
    new Set(),
  );
  expect(timing).toEqual({});
});
