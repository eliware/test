import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.19.mjs";

const cleanReport = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {},
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
  },
});
const packageJson = { scripts: { audit: "eliware-test --audit" } };

function runAudit(overrides = {}) {
  return run({
    packageJson,
    root: "C:\\repo",
    executeAudit: true,
    runAudit: async () => ({ code: 0, stdout: cleanReport, stderr: "" }),
    ...overrides,
  });
}

test("requires the shared audit script", async () => {
  await expect(run({ packageJson: { scripts: { audit: "npm audit" } } })).resolves.toMatchObject({
    status: "fail",
  });
  await expect(run({ packageJson })).resolves.toMatchObject({ status: "pass" });
});

test("accepts the self-hosted audit script and still validates the audit report", async () => {
  const runAuditAdapter = jest.fn(async () => ({ code: 0, stdout: cleanReport, stderr: "" }));
  await expect(
    run({
      packageJson: {
        name: "@eliware/test",
        scripts: { audit: "node bin/eliware-test.mjs --audit" },
      },
      root: "C:\\repo",
      executeAudit: true,
      runAudit: runAuditAdapter,
    }),
  ).resolves.toMatchObject({ status: "pass" });
  expect(runAuditAdapter).toHaveBeenCalledTimes(1);
});

test("runs audit only for aggregate validation or explicit audit mode", async () => {
  const runAuditAdapter = jest.fn(async () => ({ code: 0, stdout: cleanReport }));
  await expect(run({ packageJson, runAudit: runAuditAdapter })).resolves.toMatchObject({
    status: "pass",
  });
  expect(runAuditAdapter).not.toHaveBeenCalled();

  await expect(
    runAudit({ executeAudit: false, mode: "audit", runAudit: runAuditAdapter }),
  ).resolves.toMatchObject({ status: "pass" });
  expect(runAuditAdapter).toHaveBeenCalledTimes(1);
});

test("maps successful and invalid audit reports to check results", async () => {
  await expect(runAudit()).resolves.toEqual({ ruleId: "E-0.1.20.19", status: "pass", message: "" });
  await expect(runAudit({ runAudit: async () => ({ code: 0, stdout: "{}" }) })).resolves.toEqual({
    ruleId: "E-0.1.20.19",
    status: "fail",
    message: "npm audit returned an invalid JSON report.",
  });
});

test("maps audit process and startup failures to check results", async () => {
  await expect(
    runAudit({ runAudit: async () => ({ code: 1, stdout: "audit findings", stderr: "" }) }),
  ).resolves.toMatchObject({ status: "fail", message: "npm audit failed: audit findings" });
  await expect(
    runAudit({
      runAudit: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: "npm audit could not be started: spawn failed",
  });
});

test("rejects unsafe audit arguments before starting the adapter", async () => {
  const runAuditAdapter = jest.fn();
  await expect(
    runAudit({ toolArgs: ["--audit-level=low"], runAudit: runAuditAdapter }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("cannot override") });
  expect(runAuditAdapter).not.toHaveBeenCalled();
});
