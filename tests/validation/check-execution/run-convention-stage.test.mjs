import { expect, test } from "@jest/globals";
import { runConventionStage } from "../../../src/validation/check-execution/run-convention-stage.mjs";
import { formatConventionFailure } from "../../../src/validation/check-execution/format-convention-failure.mjs";

test("returns a passing convention stage", async () => {
  const result = await runConventionStage(async () => [
    { ruleId: "E-0.1.0.0.0", status: "pass", message: "" },
  ]);
  expect(result).toEqual({ code: 0, category: "conventions", diagnostics: [] });
});

test("reports cached stage failures without convention directives", async () => {
  await expect(
    runConventionStage(async () => [
      { ruleId: "stage:lint", stage: "lint", code: 5, status: "fail", message: "lint output" },
    ]),
  ).resolves.toEqual({
    code: 5,
    category: "validation",
    diagnostics: ["lint stage failed: lint output"],
  });
});

test("includes the complete failed directive in each check diagnostic", async () => {
  const failure = { ruleId: "E-0.1.0.0.0", status: "fail", message: "missing file" };
  const result = await runConventionStage(async () => [failure]);
  expect(result).toEqual({
    code: 12,
    category: "conventions",
    diagnostics: [formatConventionFailure(failure)],
  });
  expect(result.diagnostics[0]).toContain('"dos":');
  expect(result.diagnostics[0]).toContain('"donts":');
  expect(result.diagnostics[0]).toContain('"id": "E-0.1.0.0.0"');
});

test("uses the convention code for check failures", async () => {
  const failures = [
    { ruleId: "E-0.1.0.0.0", status: "fail", message: "first" },
    { ruleId: "E-0.1.130.14", status: "fail", message: "coverage" },
  ];
  const result = await runConventionStage(async () => failures);
  expect(result.code).toBe(12);
  expect(result.diagnostics).toEqual(failures.map((failure) => formatConventionFailure(failure)));
});

test("provides remediation even when a check omitted its message", async () => {
  const failure = { ruleId: "E-0.1.0.0.0", status: "fail" };
  await expect(runConventionStage(async () => [failure])).resolves.toEqual({
    code: 12,
    category: "conventions",
    diagnostics: [formatConventionFailure(failure)],
  });
});

test("uses the convention code for each failed convention check", async () => {
  const failure = {
    ruleId: "E-0.1.130.13",
    status: "fail",
    message: "Jest could not be started: Focused test path does not exist: tests/missing.test.mjs",
  };
  await expect(runConventionStage(async () => [failure])).resolves.toEqual({
    code: 12,
    category: "conventions",
    diagnostics: [formatConventionFailure(failure)],
  });
});

test("normalizes convention-runner errors as convention failures", async () => {
  const result = await runConventionStage(async () => {
    throw new Error("invalid config");
  });
  expect(result).toEqual({
    code: 1,
    category: "conventions",
    diagnostics: [
      "invalid config\n  How to resolve: Inspect the reported configuration, path, or check error; correct its cause, then rerun eliware-test.",
    ],
  });
});
