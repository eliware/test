import { expect, jest, test } from "@jest/globals";
import { executeAuditProcess } from "../../../../../src/checks/general/E-0.1/E-0.1.20/execute-audit-process.mjs";

test("passes the invocation environment into the executed audit child", async () => {
  const env = { npm_execpath: "selected-npm.js", npm_config_registry: "https://registry.invalid/" };
  const runChild = jest.fn(async () => ({ code: 0 }));
  const resolveCommand = jest.fn(() => [process.execPath, ["selected-npm.js"]]);
  const runAudit = jest.fn(async ({ root, run, extraArgs, env: receivedEnv }) => {
    await run(process.execPath, ["npm-cli.js", "audit"], { cwd: root });
    return { code: 0, receivedEnv, args: extraArgs };
  });
  await expect(
    executeAuditProcess({
      root: "/repo",
      runAudit,
      runChild,
      resolveCommand,
      toolArgs: ["--no-fund"],
      env,
    }),
  ).resolves.toEqual({ code: 0, receivedEnv: env, args: ["--no-fund"] });
  expect(runChild).toHaveBeenCalledWith(process.execPath, ["npm-cli.js", "audit"], {
    cwd: "/repo",
    env,
  });
  expect(runAudit).toHaveBeenCalledWith(
    expect.objectContaining({ resolveCommand, root: "/repo", extraArgs: ["--no-fund"] }),
  );
});

test("lets the npm audit adapter resolve its own child arguments", async () => {
  const runChild = jest.fn();
  const runAudit = async ({ run }) => run("npm", ["audit"]);
  await executeAuditProcess({ root: "/repo", runAudit, runChild, toolArgs: [], env: {} });
  expect(runChild).toHaveBeenCalledWith("npm", ["audit"], { env: {} });
});

test("passes the invocation environment through to the audit adapter", async () => {
  const env = { npm_execpath: "selected-npm-cli.js" };
  const runAudit = jest.fn(async ({ env: receivedEnv }) => ({ receivedEnv }));
  await expect(
    executeAuditProcess({
      root: "/repo",
      runAudit,
      runChild: jest.fn(),
      toolArgs: [],
      env,
    }),
  ).resolves.toEqual({ receivedEnv: env });
  expect(runAudit).toHaveBeenCalledWith({
    root: "/repo",
    run: expect.any(Function),
    resolveCommand: undefined,
    extraArgs: [],
    env,
  });
});
