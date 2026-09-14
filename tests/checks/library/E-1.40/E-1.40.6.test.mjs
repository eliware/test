import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/library/E-1.40/E-1.40.6.mjs";

test("requires and executes typecheck", async () => {
  await expect(
    run({ packageJson: { scripts: { typecheck: "tsc" } } }),
  ).resolves.toEqual({ ruleId: "E-1.40.6", status: "pass", message: "" });
  await expect(
    run({
      packageJson: { scripts: { typecheck: "tsc" } },
      executePackageChecks: true,
      mode: "focused",
    }),
  ).resolves.toEqual({ ruleId: "E-1.40.6", status: "pass", message: "" });
  await expect(
    run({
      packageJson: { scripts: { typecheck: "tsc" } },
      executePackageChecks: true,
      runScript: async () => ({ code: 0, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual({ ruleId: "E-1.40.6", status: "pass", message: "" });
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
});
