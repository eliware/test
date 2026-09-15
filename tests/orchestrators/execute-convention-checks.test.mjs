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

test("does not represent non-deterministic checks as successful enforcement", async () => {
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
  expect(calls).toBe(0);
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

test("reports timing through the legacy step callback when start is unavailable", async () => {
  const timing = { step: jest.fn() };
  await executeConventionChecks(
    [{ ruleId: "E-5", run: async () => ({ ruleId: "E-5", status: "pass", message: "" }) }],
    { timing },
    new Set(),
  );
  expect(timing.step).toHaveBeenCalledWith("E-5 started", "E-5 completed");
});
