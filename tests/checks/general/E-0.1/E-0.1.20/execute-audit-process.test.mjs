import { expect, jest, test } from "@jest/globals";
import { executeAuditProcess } from "../../../../../src/checks/general/E-0.1/E-0.1.20/execute-audit-process.mjs";

test("passes the invocation environment into the executed audit child", async () => {
  const env = { npm_execpath: "selected-npm.js", npm_config_registry: "https://registry.invalid/" };
  const runChild = jest.fn(async () => ({ code: 0 }));
  const runAudit = jest.fn(async (root, run, resolve, args, receivedEnv) => {
    await run(process.execPath, ["npm-cli.js", "audit"], { cwd: root });
    return { code: 0, receivedEnv, args };
  });
  await expect(executeAuditProcess({
    root: "/repo",
    runAudit,
    runChild,
    toolArgs: ["--omit=dev"],
    env,
  })).resolves.toEqual({ code: 0, receivedEnv: env, args: ["--omit=dev"] });
  expect(runChild).toHaveBeenCalledWith(process.execPath, ["npm-cli.js", "audit"], {
    cwd: "/repo",
    env,
  });
});

test("lets the npm audit adapter resolve its own child arguments", async () => {
  const runChild = jest.fn();
  const runAudit = async (_root, run) => run("npm", ["audit"]);
  await executeAuditProcess({ root: "/repo", runAudit, runChild, toolArgs: [], env: {} });
  expect(runChild).toHaveBeenCalledWith("npm", ["audit"], { env: {} });
});
