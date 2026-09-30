import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.4.mjs";

test("requires a nonempty lint script", async () => {
  await expect(
    run({ packageJson: { scripts: { lint: "eliware-test --lint" } } }),
  ).resolves.toMatchObject({ status: "pass" });
  await expect(run({ packageJson: { scripts: { lint: "" } } })).resolves.toMatchObject({
    status: "fail",
  });
  await expect(run({ packageJson: {} })).resolves.toEqual({
    ruleId: "E-0.1.4",
    status: "fail",
    message: "Repositories must define a lint validation command.",
  });
});

test("executes and reports the bundled lint result when requested", async () => {
  const packageJson = { scripts: { lint: "eliware-test --lint" } };
  await expect(
    run({
      packageJson,
      root: "C:/repo",
      executeLint: true,
      repositoryFiles: ["src/main.mjs"],
      runLint: async () => ({ code: 0 }),
    }),
  ).resolves.toMatchObject({ status: "pass" });
  await expect(
    run({
      packageJson,
      root: "C:/repo",
      executeLint: true,
      repositoryFiles: ["src/main.mjs"],
      runLint: async () => ({ code: 1, stdout: "warning" }),
    }),
  ).resolves.toMatchObject({ status: "fail" });
});

test("rejects policy-changing lint arguments before invoking Oxlint", async () => {
  const runLint = jest.fn();
  await expect(
    run({
      packageJson: { scripts: { lint: "eliware-test --lint" } },
      root: "C:/repo",
      executeLint: true,
      mode: "lint",
      repositoryFiles: ["src/main.mjs"],
      toolArgs: ["--quiet"],
      runLint,
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("positive --threads"),
  });
  expect(runLint).not.toHaveBeenCalled();
});

test("does not execute lint outside the lint stage", async () => {
  const runLint = jest.fn();
  const packageJson = { scripts: { lint: "eliware-test --lint" } };
  await expect(run({ packageJson, executeLint: false, runLint })).resolves.toMatchObject({
    status: "pass",
  });
  await expect(
    run({ packageJson, executeLint: true, mode: "test", runLint }),
  ).resolves.toMatchObject({ status: "pass" });
  expect(runLint).not.toHaveBeenCalled();
});

test("reports lint failures, empty diagnostics, and launch errors", async () => {
  const packageJson = { scripts: { lint: "eliware-test --lint" } };
  await expect(
    run({
      packageJson,
      executeLint: true,
      mode: "lint",
      repositoryFiles: ["src/main.mjs"],
      runLint: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.4",
    status: "fail",
    message: "Oxlint failed without diagnostics.",
  });
  await expect(
    run({
      packageJson,
      executeLint: true,
      mode: "lint",
      repositoryFiles: ["src/main.mjs"],
      runLint: async () => ({ code: 1, stderr: "bad" }),
    }),
  ).resolves.toEqual(expect.objectContaining({ message: "Oxlint failed: bad" }));
  await expect(
    run({
      packageJson,
      executeLint: true,
      mode: "lint",
      repositoryFiles: ["src/main.mjs"],
      runLint: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.4",
    status: "fail",
    message: "Oxlint could not be started: spawn failed",
  });
});

test("passes without invoking Oxlint when the repository has no Oxlintable files", async () => {
  const runLint = jest.fn();
  await expect(
    run({
      packageJson: { scripts: { lint: "eliware-test --lint" } },
      root: "C:/repo",
      executeLint: true,
      mode: "lint",
      repositoryFiles: ["README.md", ".knit/deploy.yaml", "package.json"],
      runLint,
    }),
  ).resolves.toMatchObject({ status: "pass" });
  expect(runLint).not.toHaveBeenCalled();
});

test("uses the shared repository inventory to decide whether Oxlint has files", async () => {
  const runLint = jest.fn(async () => ({ code: 0 }));
  const repositoryInventory = { files: jest.fn(async () => ["scripts/check.ts"]) };
  await expect(
    run({
      packageJson: { scripts: { lint: "eliware-test --lint" } },
      root: "C:/repo",
      executeLint: true,
      mode: "lint",
      repositoryInventory,
      runLint,
    }),
  ).resolves.toMatchObject({ status: "pass" });
  expect(repositoryInventory.files).toHaveBeenCalledWith("repository");
  expect(runLint).toHaveBeenCalledTimes(1);
});

test("fails when the lint file inventory is unavailable", async () => {
  await expect(
    run({
      packageJson: { scripts: { lint: "eliware-test --lint" } },
      root: "C:/repo",
      executeLint: true,
      mode: "lint",
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.4",
    status: "fail",
    message: "Repository file inventory is unavailable for lint validation.",
  });
});

test("reports repository inventory failures separately from Oxlint failures", async () => {
  await expect(
    run({
      packageJson: { scripts: { lint: "eliware-test --lint" } },
      root: "C:/repo",
      executeLint: true,
      mode: "lint",
      repositoryInventory: {
        files: async () => {
          throw new Error("scan failed");
        },
      },
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.4",
    status: "fail",
    message: "Repository file inventory could not be read: scan failed",
  });
});
