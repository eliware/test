import { expect, test } from "@jest/globals";
import { runConventionStage } from "../../src/orchestrators/run-convention-stage.mjs";
import { formatConventionFailure } from "../../src/orchestrators/convention-remediation.mjs";

test("returns a passing convention stage", async () => {
  const result = await runConventionStage(async () => [
    { ruleId: "E-1.0", status: "pass", message: "" },
  ]);
  expect(result).toEqual({ code: 0, category: "conventions", diagnostics: [] });
});

test("adds resolution guidance to each failed-check diagnostic", async () => {
  const failure = { ruleId: "E-1.0", status: "fail", message: "missing file" };
  const result = await runConventionStage(async () => [failure]);
  expect(result).toEqual({
    code: 18,
    category: "conventions",
    diagnostics: [formatConventionFailure(failure)],
  });
  expect(result.diagnostics[0]).toContain("How to resolve:");
});

test("preserves stable failure codes for each validation stage", async () => {
  const cases = [
    ["E-1.20", "Jest failed", 8],
    ["E-1.20.10", "coverage gap", 10],
    ["E-1.4", "Oxlint failed", 12],
    ["E-1.4", "process could not be started", 14],
    ["E-1.140.1", "pack failed", 17],
    ["E-1.20", "Jest could not be started", 14],
    ["E-1.20", "unsupported focused path", 18],
    ["E-1.20.12", "publication metadata", 17],
  ];
  for (const [ruleId, message, code] of cases) {
    const failure = { ruleId, status: "fail", message };
    await expect(runConventionStage(async () => [failure])).resolves.toEqual({
      code,
      category: "conventions",
      diagnostics: [formatConventionFailure(failure)],
    });
  }
});

test("uses the highest code when several checks fail and preserves each remediation", async () => {
  const failures = [
    { ruleId: "E-1.0", status: "fail", message: "first" },
    { ruleId: "E-1.20.10", status: "fail", message: "coverage" },
  ];
  const result = await runConventionStage(async () => failures);
  expect(result.code).toBe(18);
  expect(result.diagnostics).toEqual(failures.map((failure) => formatConventionFailure(failure)));
});

test("provides remediation even when a check omitted its message", async () => {
  const failure = { ruleId: "E-1.0", status: "fail" };
  await expect(runConventionStage(async () => [failure])).resolves.toEqual({
    code: 18,
    category: "conventions",
    diagnostics: [formatConventionFailure(failure)],
  });
});

test("classifies invalid focused paths as argument failures and provides guidance", async () => {
  const failure = {
    ruleId: "E-1.20",
    status: "fail",
    message: "Jest could not be started: Focused test path does not exist: tests/missing.test.mjs",
  };
  await expect(runConventionStage(async () => [failure])).resolves.toEqual({
    code: 18,
    category: "conventions",
    diagnostics: [formatConventionFailure(failure)],
  });
});

test("normalizes convention-runner errors as convention failures", async () => {
  const result = await runConventionStage(async () => {
    throw new Error("invalid config");
  });
  expect(result).toEqual({
    code: 18,
    category: "conventions",
    diagnostics: [
      "invalid config\n  How to resolve: Inspect the reported configuration, path, or check error; correct its cause, then rerun eliware-test.",
    ],
  });
});
