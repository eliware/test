import { expect, jest, test } from "@jest/globals";
import createBasicValidationStageRunners from "../../../../../src/validation/stages/registry/create/basic-validation-stage-runners.mjs";
test("uses default stage tools when no overrides are given", () => {
  const runners = createBasicValidationStageRunners();
  expect(Object.keys(runners)).toEqual(["jest", "lint", "format", "audit"]);
});
test("skips lint when every focused path is ignored", async () => {
  const runLint = jest.fn();
  const runners = createBasicValidationStageRunners({
    runLint,
    resolveFocusedPaths: async () => [],
  });
  await expect(
    runners.lint({
      root: ".",
      focusedScope: {
        paths: ["tests/artifacts/file.test.mjs"],
      },
    }),
  ).resolves.toMatchObject({
    stage: "lint",
    code: 0,
  });
  expect(runLint).not.toHaveBeenCalled();
});
test("accepts an audit exemption without printing a warning", async () => {
  const runners = createBasicValidationStageRunners({
    runAudit: async () => ({
      code: 1,
      stdout: JSON.stringify({
        vulnerabilities: {
          picomatch: {
            severity: "high",
            via: [
              {
                severity: "high",
                url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf",
              },
            ],
          },
        },
      }),
    }),
  });
  await expect(
    runners.audit({
      root: ".",
      packageJson: {
        eliware: {
          exempt: [
            {
              ruleId: "stage:audit",
              advisories: ["GHSA-fc5q-39xc-vjpf"],
            },
          ],
        },
      },
    }),
  ).resolves.toMatchObject({
    code: 0,
    message: "",
    status: "pass",
  });
});
test("handles successful, failed, timed out, and rejected audit runs", async () => {
  const successful = createBasicValidationStageRunners({
    runAudit: async () => ({ code: 0, stdout: "" }),
  });
  await expect(successful.audit({ root: "." })).resolves.toMatchObject({
    code: 0,
    message: "",
  });
  const failed = createBasicValidationStageRunners({
    runAudit: async () => ({ code: 1, stdout: "audit details" }),
  });
  await expect(failed.audit({ root: "." })).resolves.toMatchObject({
    code: 7,
    message: "npm audit failed.\naudit details",
  });
  const timedOut = createBasicValidationStageRunners({
    runAudit: async () => ({ code: null, timedOut: true }),
  });
  await expect(timedOut.audit({ root: "." })).resolves.toMatchObject({
    code: 0,
    status: "warning",
  });
  const rejected = createBasicValidationStageRunners({
    runAudit: async () => {
      throw new Error("audit process failed");
    },
  });
  await expect(rejected.audit({ root: "." })).resolves.toMatchObject({
    code: 7,
    message: "audit process failed",
  });
});
