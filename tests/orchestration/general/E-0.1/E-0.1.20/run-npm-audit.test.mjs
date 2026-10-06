import { expect, jest, test } from "@jest/globals";
import { runNpmAudit } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/run-npm-audit.mjs";

function createRunner(calls) {
  return async (...args) => {
    calls.push(args);
    return { code: 0, signal: null, stdout: "", stderr: "" };
  };
}

test("runs npm audit in the repository root", async () => {
  const calls = [];
  const env = { PATH: "C:\\tools" };
  const resolveCommand = jest.fn(() => ["npm", []]);
  const result = await runNpmAudit({
    root: "C:\\repo",
    run: createRunner(calls),
    resolveCommand,
    env,
  });
  expect(result.code).toBe(0);
  expect(calls[0][1]).toEqual(["audit", "--json", "--audit-level=high"]);
  expect(calls[0][2]).toEqual({ cwd: "C:\\repo", env });
});

test("documents resolver inputs and accepts its command tuple", async () => {
  const calls = [];
  const env = { npm_execpath: "C:\\node\\npm-cli.js" };
  const resolveCommand = jest.fn(({ env: receivedEnv, platform, execPath, root }) => {
    expect(receivedEnv).toBe(env);
    expect(platform).toBe(process.platform);
    expect(execPath).toBe(process.execPath);
    expect(root).toBe("C:\\repo");
    return [process.execPath, [env.npm_execpath]];
  });
  await runNpmAudit({ root: "C:\\repo", run: createRunner(calls), resolveCommand, env });
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1][0]).toBe(env.npm_execpath);
});

test("forwards allowed audit arguments", async () => {
  const calls = [];
  await runNpmAudit({
    root: "C:\\repo",
    run: createRunner(calls),
    resolveCommand: () => ["npm", ["custom-cli.js"]],
    extraArgs: ["--no-fund"],
  });
  expect(calls[0][1]).toEqual([
    "custom-cli.js",
    "audit",
    "--no-fund",
    "--json",
    "--audit-level=high",
  ]);
});

test("uses the default resolver with the invocation environment", async () => {
  const calls = [];
  await runNpmAudit({
    root: "C:\\repo",
    run: createRunner(calls),
    env: { npm_execpath: process.execPath },
  });
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1][0]).toBe(process.execPath);
});

test("rejects audit overrides before resolving or running", async () => {
  const run = jest.fn();
  const resolveCommand = jest.fn(() => ["npm", []]);
  await expect(
    runNpmAudit({ root: "C:\\repo", run, resolveCommand, extraArgs: ["--audit-level=low"] }),
  ).rejects.toThrow("cannot override");
  expect(run).not.toHaveBeenCalled();
  expect(resolveCommand).not.toHaveBeenCalled();
});

test("rejects scope-changing audit arguments at the runner boundary", async () => {
  for (const argument of ["--omit=dev", "--workspace=other", "--no-package-lock"]) {
    const run = jest.fn();
    const resolveCommand = jest.fn(() => ["npm", []]);
    await expect(
      runNpmAudit({ root: "C:\\repo", run, resolveCommand, extraArgs: [argument] }),
    ).rejects.toThrow();
    expect(run).not.toHaveBeenCalled();
    expect(resolveCommand).not.toHaveBeenCalled();
  }
});

test("rejects malformed executable resolver tuples before invoking the runner", async () => {
  for (const resolved of [
    null,
    [],
    ["", []],
    ["npm", null],
    ["npm", [null]],
    ["npm", [], "extra"],
  ]) {
    const run = jest.fn();
    await expect(
      runNpmAudit({ root: "C:\\repo", run, resolveCommand: () => resolved }),
    ).rejects.toThrow("resolveCommand must return an executable and string argument prefix.");
    expect(run).not.toHaveBeenCalled();
  }
});

test("rejects incomplete runner options", async () => {
  await expect(runNpmAudit()).rejects.toThrow("child-process runner");
  await expect(runNpmAudit({ root: "C:\\repo" })).rejects.toThrow("child-process runner");
  await expect(
    runNpmAudit({ root: "C:\\repo", run: createRunner([]), resolveCommand: null }),
  ).rejects.toThrow("executable resolver");
});
