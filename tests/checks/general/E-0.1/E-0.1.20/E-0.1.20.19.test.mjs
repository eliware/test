import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.19.mjs";

const cleanAuditReport = JSON.stringify({ vulnerabilities: {} });

test("requires the shared audit stage script", async () => {
  await expect(
    run({ packageJson: { scripts: { audit: "eliware-test --audit" } } }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.19", status: "pass", message: "" });
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
    ruleId: "E-0.1.20.19",
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
    ruleId: "E-0.1.20.19",
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

test("redacts configured secrets embedded between credential delimiters", async () => {
  const result = await run({
    packageJson: { scripts: { audit: "eliware-test --audit" } },
    root: "C:\\repo",
    executeAudit: true,
    env: { NPM_TOKEN: "tiny-secret" },
    runAudit: async () => ({
      code: 1,
      stdout: "NPM_TOKEN=prefix-tiny-secret-suffix",
      stderr: "",
    }),
  });
  expect(result.status).toBe("fail");
  expect(result.message).not.toContain("tiny-secret");
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
    ruleId: "E-0.1.20.19",
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
      runAudit: async () => ({ code: 0, stdout: cleanAuditReport, stderr: "" }),
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.19", status: "pass", message: "" });
});

test("executes audit for the explicit audit mode even when aggregate execution is disabled", async () => {
  const runAudit = jest.fn(async () => ({ code: 0, stdout: cleanAuditReport, stderr: "" }));
  await expect(run({
    packageJson: { scripts: { audit: "eliware-test --audit" } },
    root: "C:\\repo",
    mode: "audit",
    executeAudit: false,
    runAudit,
  })).resolves.toMatchObject({ status: "pass" });
  expect(runAudit).toHaveBeenCalledTimes(1);
});

test("executes audit during the aggregate validation mode", async () => {
  let called = false;
  await expect(
    run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      runAudit: async () => { called = true; return { code: 0, stdout: cleanAuditReport, stderr: "" }; },
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.19", status: "pass", message: "" });
  expect(called).toBe(true);
});

test("passes the invocation environment through the audit adapter", async () => {
  const env = { npm_execpath: "selected-npm-cli.js" };
  let received;
  await run({
    packageJson: { scripts: { audit: "eliware-test --audit" } },
    root: "C:\\repo",
    executeAudit: true,
    env,
    runAudit: async (...args) => {
      received = args;
      return { code: 0, stdout: cleanAuditReport };
    },
  });
  expect(received[4]).toBe(env);
});

test("rejects successful npm audit runs without a usable JSON report", async () => {
  for (const stdout of ["not json", "null", "[]", JSON.stringify({ vulnerabilities: null }), JSON.stringify({ vulnerabilities: [] })]) {
    await expect(run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      runAudit: async () => ({ code: 0, stdout }),
    })).resolves.toMatchObject({ status: "fail", message: "npm audit returned an invalid JSON report." });
  }
});

test("rejects successful npm audit reports above the required high severity threshold", async () => {
  for (const vulnerabilities of [{ high: 1, critical: 0 }, { high: 0, critical: 1 }]) {
    await expect(run({
      packageJson: { scripts: { audit: "eliware-test --audit" } },
      root: "C:\\repo",
      executeAudit: true,
      runAudit: async () => ({ code: 0, stdout: JSON.stringify({ vulnerabilities }) }),
    })).resolves.toMatchObject({ status: "fail", message: "npm audit returned an invalid JSON report." });
  }
  await expect(run({
    packageJson: { scripts: { audit: "eliware-test --audit" } },
    root: "C:\\repo",
    executeAudit: true,
    runAudit: async () => ({ code: 0, stdout: JSON.stringify({ vulnerabilities: { moderate: 2, high: 0, critical: 0 } }) }),
  })).resolves.toMatchObject({ status: "pass" });
});

test("rejects arguments that could weaken the audit contract", async () => {
  const runAudit = jest.fn();
  await expect(run({
    packageJson: { scripts: { audit: "eliware-test --audit" } },
    root: "C:\\repo",
    executeAudit: true,
    toolArgs: ["--audit-level=low"],
    runAudit,
  })).resolves.toMatchObject({
    ruleId: "E-0.1.20.19",
    status: "fail",
    message: expect.stringContaining("cannot override"),
  });
  expect(runAudit).not.toHaveBeenCalled();
});
