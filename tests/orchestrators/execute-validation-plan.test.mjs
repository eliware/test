import { expect, jest, test } from "@jest/globals";
import { run as runLintCheck } from "../../src/checks/general/E-0.1/E-0.1.4.mjs";
import { run as runFormatterCheck } from "../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.17.mjs";
import { run as runAuditCheck } from "../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.19.mjs";
import { executeValidationPlan } from "../../src/orchestrators/execute-validation-plan.mjs";

test("runs lint, audit, and formatting stages in the aggregate plan", async () => {
  const scripts = {
    test: "node bin/eliware-test.mjs",
    lint: "node bin/eliware-test.mjs --lint",
    audit: "node bin/eliware-test.mjs --audit",
    format: "node bin/eliware-test.mjs --format",
    "format:check": "node bin/eliware-test.mjs --format-check",
  };
  const calls = [];
  const runLint = jest.fn(async () => ({ code: 0 }));
  const runFormatter = jest.fn(async () => ({ code: 0 }));
  const runChild = jest.fn(async () => ({
    code: 0,
    stdout: JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {},
      metadata: {
        vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
      },
    }),
    stderr: "",
  }));
  const context = {
    root: "C:\\repo",
    packageJson: { name: "@eliware/test", scripts },
    executeLint: true,
    executeAudit: true,
    executeFormat: true,
    env: {},
    runLint,
    runFormatter,
    runChild,
  };
  const check = (ruleId, run) => ({
    ruleId,
    run: async (checkContext) => {
      calls.push(ruleId);
      return run(checkContext);
    },
  });
  const checks = [
    check("E-0.1.4", runLintCheck),
    check("E-0.1.20.19", runAuditCheck),
    check("E-0.1.20.17", runFormatterCheck),
  ];

  const results = await executeValidationPlan(checks, context, new Set());

  expect(results).toEqual([
    { ruleId: "E-0.1.4", status: "pass", message: "" },
    { ruleId: "E-0.1.20.19", status: "pass", message: "" },
    { ruleId: "E-0.1.20.17", status: "pass", message: "" },
  ]);
  expect(calls).toEqual(["E-0.1.4", "E-0.1.20.19", "E-0.1.20.17"]);
  expect(runLint).toHaveBeenCalledTimes(1);
  expect(runChild).toHaveBeenCalledTimes(1);
  expect(runFormatter).toHaveBeenCalledTimes(1);
});

test("rejects a missing required stage before running any stage checks", async () => {
  const run = jest.fn(async () => ({ ruleId: "E-0.1.4", status: "pass", message: "" }));

  await expect(
    executeValidationPlan(
      [{ ruleId: "E-0.1.4", run }],
      { executeLint: true, executeAudit: true },
      new Set(),
    ),
  ).rejects.toThrow("executeAudit (E-0.1.20.19)");
  expect(run).not.toHaveBeenCalled();
});
