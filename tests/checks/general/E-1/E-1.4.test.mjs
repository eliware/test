import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.4.mjs";

test("requires a nonempty lint script", async () => {
  await expect(
    run({ packageJson: { scripts: { lint: "eliware-test --lint" } } }),
  ).resolves.toMatchObject({ status: "pass" });
  await expect(run({ packageJson: { scripts: { lint: "" } } })).resolves.toMatchObject({
    status: "fail",
  });
  await expect(run({ packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.4",
    status: "fail",
    message: "Repositories must define a lint validation command.",
  });
});

test("executes and reports the bundled lint result when requested", async () => {
  const packageJson = { scripts: { lint: "eliware-test --lint" } };
  await expect(
    run({ packageJson, root: "C:/repo", executeLint: true, runLint: async () => ({ code: 0 }) }),
  ).resolves.toMatchObject({ status: "pass" });
  await expect(
    run({
      packageJson,
      root: "C:/repo",
      executeLint: true,
      runLint: async () => ({ code: 1, stdout: "warning" }),
    }),
  ).resolves.toMatchObject({ status: "fail" });
});

test("does not execute lint outside the lint stage", async () => {
  const runLint = jest.fn();
  const packageJson = { scripts: { lint: "eliware-test --lint" } };
  await expect(run({ packageJson, executeLint: false, runLint })).resolves.toMatchObject({ status: "pass" });
  await expect(run({ packageJson, executeLint: true, mode: "test", runLint })).resolves.toMatchObject({ status: "pass" });
  expect(runLint).not.toHaveBeenCalled();
});

test("reports lint failures, empty diagnostics, and launch errors", async () => {
  const packageJson = { scripts: { lint: "eliware-test --lint" } };
  await expect(
    run({ packageJson, executeLint: true, mode: "lint", runLint: async () => ({ code: 1, stdout: "", stderr: "" }) }),
  ).resolves.toEqual({ ruleId: "E-1.4", status: "fail", message: "Oxlint failed without diagnostics." });
  await expect(
    run({ packageJson, executeLint: true, mode: "lint", runLint: async () => ({ code: 1, stderr: "bad" }) }),
  ).resolves.toEqual(expect.objectContaining({ message: "Oxlint failed: bad" }));
  await expect(
    run({ packageJson, executeLint: true, mode: "lint", runLint: async () => { throw new Error("spawn failed"); } }),
  ).resolves.toEqual({ ruleId: "E-1.4", status: "fail", message: "Oxlint could not be started: spawn failed" });
});
