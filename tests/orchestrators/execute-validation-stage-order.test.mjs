import { expect, jest, test } from "@jest/globals";
import { executeConventionChecks } from "../../src/orchestrators/execute-convention-checks.mjs";

test("shares cached pre-Jest stage output with every convention check", async () => {
  const order = [];
  const context = {
    executeLint: true,
    executeJest: true,
    validationStageRunners: {
      lint: async () => {
        order.push("lint");
        return { stage: "lint", code: 0, status: "pass", output: "lint report" };
      },
      jest: async () => {
        order.push("jest");
        return { stage: "jest", code: 0, status: "pass", output: "jest report" };
      },
    },
  };
  const checks = [
    {
      ruleId: "E-before",
      run: async (checkContext) => {
        order.push("first check");
        expect(checkContext.stageResults.lint.output).toBe("lint report");
        return { ruleId: "E-before", status: "pass", message: "" };
      },
    },
    {
      ruleId: "E-after",
      run: async (checkContext) => {
        order.push("second check");
        expect(checkContext.stageResults.lint.output).toBe("lint report");
        return { ruleId: "E-after", status: "pass", message: "" };
      },
    },
  ];

  await expect(executeConventionChecks(checks, context, new Set())).resolves.toEqual([
    { ruleId: "E-before", status: "pass", message: "" },
    { ruleId: "E-after", status: "pass", message: "" },
  ]);
  expect(order).toEqual(["lint", "first check", "second check", "jest"]);
});

test("runs enabled stages, then conventions, then Jest", async () => {
  const order = [];
  const stageNames = ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"];
  const context = Object.fromEntries(
    [...stageNames, "jest"].map((stage) => [
      `execute${stage[0].toUpperCase()}${stage.slice(1)}`,
      true,
    ]),
  );
  context.validationStageRunners = Object.fromEntries(
    [...stageNames, "jest"].map((stage) => [
      stage,
      async () => {
        order.push(stage);
        return { stage, code: 0, status: "pass", message: "" };
      },
    ]),
  );
  const checks = [
    {
      ruleId: "E-pre",
      run: async () => {
        order.push("convention");
        return { ruleId: "E-pre", status: "pass", message: "" };
      },
    },
  ];
  await executeConventionChecks(checks, context, new Set());
  expect(order).toEqual([...stageNames, "convention", "jest"]);
});

test("runs pre-Jest checks and stops before Jest after any failure", async () => {
  const order = [];
  const context = {
    executeLint: true,
    executeJest: true,
    validationStageRunners: {
      lint: async () => {
        order.push("lint");
        return {
          stage: "lint",
          ruleId: "stage:lint",
          code: 5,
          status: "fail",
          message: "lint failed",
        };
      },
      jest: async () => {
        order.push("jest");
        return { stage: "jest", code: 0, status: "pass", message: "" };
      },
    },
  };
  const checks = [
    {
      ruleId: "E-before",
      run: async () => {
        order.push("convention check");
        return { ruleId: "E-before", status: "pass", message: "" };
      },
    },
    {
      ruleId: "E-after",
      run: jest.fn(async () => ({ ruleId: "E-after", status: "pass", message: "" })),
    },
  ];

  const results = await executeConventionChecks(checks, context, new Set());
  expect(order).toEqual(["lint", "convention check"]);
  expect(context.stageResults.jest.status).toBe("skip");
  expect(checks[1].run).toHaveBeenCalled();
  expect(results.map(({ status }) => status)).toEqual(["fail", "pass", "pass"]);
});

test("a failed convention check skips Jest after all checks run", async () => {
  const calls = [];
  const makeCheck = (ruleId, status = "pass") => ({
    ruleId,
    run: async () => {
      calls.push(ruleId);
      return { ruleId, status, message: status === "fail" ? "lint failed" : "" };
    },
  });
  const results = await executeConventionChecks(
    [
      makeCheck("E-0.1.130.13"),
      makeCheck("E-0.1.130.14"),
      makeCheck("E-0.1.4", "fail"),
      makeCheck("E-0.1.20.19"),
    ],
    {},
    new Set(),
  );

  expect(calls).toEqual(["E-0.1.130.13", "E-0.1.130.14", "E-0.1.4", "E-0.1.20.19"]);
  expect(results.filter(({ status }) => status === "fail")).toEqual([
    { ruleId: "E-0.1.4", status: "fail", message: "lint failed" },
  ]);
  expect(results.filter(({ status }) => status === "skip")).toEqual([]);
});
