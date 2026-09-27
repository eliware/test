import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/library/E-0.1.40/E-0.1.40.6.mjs";

test("requires and executes typecheck", async () => {
  await expect(
    run({ packageJson: { scripts: { typecheck: "tsc" } } }),
  ).resolves.toEqual({ ruleId: "E-0.1.40.6", status: "pass", message: "" });
  await expect(
    run({
      packageJson: { scripts: { typecheck: "tsc" } },
      executePackageChecks: true,
      mode: "focused",
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.40.6", status: "pass", message: "" });
  await expect(
    run({
      packageJson: { scripts: { typecheck: "tsc" } },
      executePackageChecks: true,
      runScript: async () => ({ code: 0, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.40.6", status: "pass", message: "" });
  await expect(
    run({
      packageJson: { scripts: { typecheck: "tsc" } },
      executePackageChecks: true,
      runScript: async () => ({ code: 1, stdout: "type error", stderr: "" }),
    }),
  ).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("type error") }),
  );
  await expect(
    run({
      packageJson: { scripts: { typecheck: "tsc" } },
      executePackageChecks: true,
      runScript: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: "typecheck failed without diagnostics." }),
  );
  await expect(
    run({
      packageJson: { scripts: { typecheck: "tsc" } },
      executePackageChecks: true,
      runScript: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: "typecheck could not be started: spawn failed" }),
  );
  await expect(run({ packageJson: { scripts: {} } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await expect(run({ packageJson: { scripts: { typecheck: "echo skipped" } } })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("recognized direct") }),
  );
});

test("executes only for aggregate or matching typecheck mode", async () => {
  const calls = [];
  const runScript = async (_root, name) => {
    calls.push(name);
    return { code: 0, stdout: "", stderr: "" };
  };
  await expect(run({ packageJson: { scripts: { typecheck: "tsc" } }, executePackageChecks: true, mode: "typecheck", runScript })).resolves.toMatchObject({ status: "pass" });
  await expect(run({ packageJson: { scripts: { typecheck: "tsc" } }, executePackageChecks: true, mode: "build", runScript })).resolves.toMatchObject({ status: "pass" });
  expect(calls).toEqual(["typecheck"]);
});

test("forwards the invocation environment to the typecheck script runner", async () => {
  const env = { PATH: "invocation-path", npm_execpath: "C:/npm/npm-cli.js" };
  const runScript = jest.fn(async () => ({ code: 0, stdout: "", stderr: "" }));
  await run({
    root: "C:/repo",
    packageJson: { scripts: { typecheck: "tsc" } },
    executePackageChecks: true,
    mode: "typecheck",
    runScript,
    env,
  });
  expect(runScript).toHaveBeenCalledWith("C:/repo", "typecheck", undefined, undefined, env);
});
