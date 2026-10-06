import { expect, jest, test } from "@jest/globals";
import { executeConventionChecks } from "../../src/orchestrators/execute-convention-checks.mjs";

const pass = (ruleId) => ({ ruleId, status: "pass", message: "" });
const makeCheck = (ruleId, calls, status = "pass") => ({
  ruleId,
  run: async () => {
    calls.push(ruleId);
    return { ruleId, status, message: status === "fail" ? "check failed" : "" };
  },
});

function createStageContext(stages, calls, failedStage = "") {
  const names = [...stages, "jest"];
  return {
    ...Object.fromEntries(
      names.map((stage) => [`execute${stage[0].toUpperCase()}${stage.slice(1)}`, true]),
    ),
    validationStageRunners: Object.fromEntries(
      names.map((stage) => [
        stage,
        async () => {
          calls.push(stage);
          return {
            stage,
            code: failedStage === stage ? 5 : 0,
            status: failedStage === stage ? "fail" : "pass",
            message: "",
            output: `${stage} report`,
          };
        },
      ]),
    ),
  };
}

test("executes selected checks in discovery order", async () => {
  const calls = [];
  const checks = ["E-0.1.4", "E-0.1.20.17", "E-0.1.20.19"].map((id) => makeCheck(id, calls));
  const results = await executeConventionChecks(checks, {}, new Set());
  expect(calls).toEqual(checks.map(({ ruleId }) => ruleId));
  expect(results).toEqual(checks.map(({ ruleId }) => pass(ruleId)));
});

test("reports thrown checks and continues with later checks", async () => {
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
      makeCheck("E-2", calls),
    ],
    {},
    new Set(),
  );
  expect(calls).toEqual(["E-0.1", "E-2"]);
  expect(results[0]).toMatchObject({ ruleId: "E-0.1", status: "fail" });
  expect(results[1]).toEqual(pass("E-2"));
});

test("runs every enabled stage before checks and Jest, with cached output", async () => {
  const calls = [];
  const stages = ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"];
  const context = createStageContext(stages, calls);
  const checks = ["E-first", "E-second"].map((id) => ({
    ruleId: id,
    run: async (checkContext) => {
      calls.push(id);
      expect(checkContext.stageResults.lint.output).toBe("lint report");
      return pass(id);
    },
  }));
  await executeConventionChecks(checks, context, new Set());
  expect(calls).toEqual([...stages, "E-first", "E-second", "jest"]);
});

test("runs all checks but skips Jest after a stage failure", async () => {
  const calls = [];
  const context = createStageContext(["lint"], calls, "lint");
  const checks = [
    makeCheck("E-before", calls),
    { ...makeCheck("E-after", calls), run: jest.fn(makeCheck("E-after", calls).run) },
  ];
  const results = await executeConventionChecks(checks, context, new Set());
  expect(calls).toEqual(["lint", "E-before", "E-after"]);
  expect(checks[1].run).toHaveBeenCalled();
  expect(context.stageResults.jest.status).toBe("skip");
  expect(results.map(({ status }) => status)).toEqual(["fail", "pass", "pass"]);
});

test("runs every convention check but skips Jest after a check fails", async () => {
  const calls = [];
  const checks = [
    makeCheck("E-0.1.130.13", calls),
    makeCheck("E-0.1.130.14", calls),
    makeCheck("E-0.1.4", calls, "fail"),
    makeCheck("E-0.1.20.19", calls),
  ];
  const results = await executeConventionChecks(checks, {}, new Set());
  expect(calls).toEqual(checks.map(({ ruleId }) => ruleId));
  expect(results.filter(({ status }) => status === "fail")).toEqual([
    { ruleId: "E-0.1.4", status: "fail", message: "check failed" },
  ]);
  expect(results.some(({ status }) => status === "skip")).toBe(false);
});

test("executes selected non-deterministic checks", async () => {
  const calls = [];
  const check = makeCheck("E-3", calls);
  check.enforcementMode = "non-deterministic";
  await expect(executeConventionChecks([check], {}, new Set())).resolves.toEqual([pass("E-3")]);
  expect(calls).toEqual(["E-3"]);
});

test("executes required checks beneath advisory parents", async () => {
  const ids = [
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
  const placeholders = ids.map((ruleId) => ({
    ruleId,
    applicability: "advisory-only",
    run: jest.fn(),
  }));
  const checks = [
    ...placeholders,
    { ruleId: "E-0.1.26", applicability: "advisory-only", run: jest.fn() },
    { ...makeCheck("A-0.1.26.0", []), parentRuleId: "E-0.1.26" },
  ];
  const results = await executeConventionChecks(checks, {}, new Set());
  expect(results.map(({ ruleId }) => ruleId)).toEqual(["A-0.1.26.0"]);
  expect(results[0].status).toBe("pass");
});
