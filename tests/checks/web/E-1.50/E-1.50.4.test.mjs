import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/web/E-1.50/E-1.50.4.mjs";

test("requires and executes the build script", async () => {
  await expect(run({ packageJson: { scripts: { build: "webpack" } } })).resolves.toEqual({
    ruleId: "E-1.50.4",
    status: "pass",
    message: "",
  });
  await expect(
    run({ packageJson: { scripts: { build: "webpack" } }, executePackageChecks: true, mode: "focused" }),
  ).resolves.toEqual({ ruleId: "E-1.50.4", status: "pass", message: "" });
  await expect(
    run({
      packageJson: { scripts: { build: "webpack" } },
      executePackageChecks: true,
      runScript: async () => ({ code: 0, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({ ruleId: "E-1.50.4", status: "pass", message: "" });
  await expect(
    run({
      packageJson: { scripts: { build: "webpack" } },
      executePackageChecks: true,
      runScript: async () => ({ code: 1, stdout: "build error", stderr: "" }),
    }),
  ).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("build error") }),
  );
  await expect(
    run({
      packageJson: { scripts: { build: "webpack" } },
      executePackageChecks: true,
      runScript: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: "build failed without diagnostics." }),
  );
  await expect(
    run({
      packageJson: { scripts: { build: "webpack" } },
      executePackageChecks: true,
      runScript: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: "build could not be started: spawn failed" }),
  );
  await expect(run({ packageJson: { scripts: {} } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});
