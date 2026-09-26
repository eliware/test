import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.19.mjs";

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
      runAudit: async () => ({ code: 0, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.19", status: "pass", message: "" });
});

test("executes audit for the explicit audit mode even when aggregate execution is disabled", async () => {
  const runAudit = jest.fn(async () => ({ code: 0, stdout: "", stderr: "" }));
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
      runAudit: async () => { called = true; return { code: 0, stdout: "", stderr: "" }; },
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
      return { code: 0 };
    },
  });
  expect(received[4]).toBe(env);
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
