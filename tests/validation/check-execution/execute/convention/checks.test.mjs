import { expect, jest, test } from "@jest/globals";
import { executeConventionChecks } from "../../../../../src/validation/check-execution/execute/convention/checks.mjs";

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

test("runs the two pre-Jest barriers and Jest with cached stage output", async () => {
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
  expect(context.validationSummary.checkCount).toBe(9);
});

test("stops after initial stages fail and skips checks and Jest", async () => {
  const calls = [];
  const context = createStageContext(["lint"], calls, "lint");
  const checks = [
    makeCheck("E-before", calls),
    { ...makeCheck("E-after", calls), run: jest.fn(makeCheck("E-after", calls).run) },
  ];
  const results = await executeConventionChecks(checks, context, new Set());
  expect(calls).toEqual(["lint"]);
  expect(checks[1].run).not.toHaveBeenCalled();
  expect(context.stageResults.jest.status).toBe("skip");
  expect(results.map(({ status }) => status)).toEqual(["fail"]);
});

test("waits for all initial stages before starting remaining checks", async () => {
  const calls = [];
  const stages = ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"];
  const context = createStageContext(stages, calls);
  let releaseInitial;
  let markInitialStarted;
  const initialStarted = new Promise((resolve) => (markInitialStarted = resolve));
  const initialGate = new Promise((resolve) => (releaseInitial = resolve));
  const initialNames = new Set(["lint", "format", "audit", "outdated"]);
  for (const stage of initialNames) {
    context.validationStageRunners[stage] = async () => {
      calls.push(stage);
      if (initialNames.size === [...initialNames].filter((name) => calls.includes(name)).length)
        markInitialStarted();
      await initialGate;
      return { stage, code: 0, status: "pass", message: "", output: `${stage} report` };
    };
  }

  const validation = executeConventionChecks([makeCheck("E-rule", calls)], context, new Set());
  await initialStarted;
  expect(calls).toEqual([...initialNames]);
  releaseInitial();
  await validation;
  expect(calls).toContain("E-rule");
  expect(calls).toContain("pack");
  expect(calls.at(-1)).toBe("jest");
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
