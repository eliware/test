import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.19.mjs";

test("requires the shared audit stage script", async () => {
  await expect(
    run({ packageJson: { scripts: { audit: "eliware-test --audit" } } }),
  ).resolves.toEqual({ ruleId: "E-1.20.19", status: "pass", message: "" });
  await expect(run({ packageJson: { scripts: { audit: "npm audit" } } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("reports audit diagnostics when the audit stage fails", async () => {
  await expect(
    run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      mode: "audit",
      runAudit: async () => ({ code: 1, stdout: "audit findings", stderr: "" }),
    }),
  ).resolves.toEqual({
    ruleId: "E-1.20.19",
    status: "fail",
    message: "npm audit failed: audit findings",
  });
});

test("reports audit failures without diagnostics", async () => {
  await expect(
    run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      mode: "audit",
      runAudit: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({
    ruleId: "E-1.20.19",
    status: "fail",
    message: "npm audit failed without diagnostics.",
  });
});

test("redacts audit output and startup errors using the invoking environment", async () => {
  await expect(run({
    packageJson: { scripts: { audit: "eliware-test --audit" } },
    root: "C:\\repo",
    executeAudit: true,
    env: { NPM_TOKEN: "tiny" },
    runAudit: async () => ({ code: 1, stdout: "token=tiny", stderr: "tiny" }),
  })).resolves.toMatchObject({ status: "fail", message: "npm audit failed: token=[REDACTED]\n[REDACTED]" });
  await expect(run({
    packageJson: { scripts: { audit: "eliware-test --audit" } },
    root: "C:\\repo",
    executeAudit: true,
    env: { NPM_TOKEN: "tiny" },
    runAudit: async () => { throw new Error("spawn leaked tiny"); },
  })).resolves.toMatchObject({ status: "fail", message: "npm audit could not be started: spawn leaked [REDACTED]" });
});

test("reports audit startup failures", async () => {
  await expect(
    run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      mode: "audit",
      runAudit: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toEqual({
    ruleId: "E-1.20.19",
    status: "fail",
    message: "npm audit could not be started: spawn failed",
  });
});

test("passes when the audit stage succeeds", async () => {
  await expect(
    run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      mode: "audit",
      runAudit: async () => ({ code: 0, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({ ruleId: "E-1.20.19", status: "pass", message: "" });
});

test("executes audit during the aggregate validation mode", async () => {
  let called = false;
  await expect(
    run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      runAudit: async () => { called = true; return { code: 0, stdout: "", stderr: "" }; },
    }),
  ).resolves.toEqual({ ruleId: "E-1.20.19", status: "pass", message: "" });
  expect(called).toBe(true);
});
