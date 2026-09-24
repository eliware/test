import { expect, test } from "@jest/globals";
import { validateRequiredStagePlan } from "../../src/orchestrators/validate-required-stage-plan.mjs";

test("accepts all enabled stage owners", () => {
  const ids = ["E-1.130.13", "E-1.4", "E-1.20.19", "E-1.140.1", "E-1.20.17"];
  expect(() =>
    validateRequiredStagePlan(
      ids.map((ruleId) => ({ ruleId })),
      {
        executeJest: true,
        executeLint: true,
        executeAudit: true,
        executePack: true,
        executeFormat: true,
        executePackageChecks: true,
        packageJson: { eliware: { apply: ["general", "application", "npm-published"] } },
      },
    ),
  ).not.toThrow();
});

test("does not require the npm pack owner for repositories without the npm-published profile", () => {
  const ids = ["E-1.130.13", "E-1.4", "E-1.20.19", "E-1.20.17"];
  expect(() =>
    validateRequiredStagePlan(
      ids.map((ruleId) => ({ ruleId })),
      {
        executeJest: true,
        executeLint: true,
        executeAudit: true,
        executePack: true,
        executeFormat: true,
        packageJson: { private: true, eliware: { apply: ["general", "application", "private"] } },
      },
    ),
  ).not.toThrow();
});

test("still requires the npm pack owner when npm-published applies", () => {
  const ids = ["E-1.130.13", "E-1.4", "E-1.20.19", "E-1.20.17"];
  expect(() =>
    validateRequiredStagePlan(
      ids.map((ruleId) => ({ ruleId })),
      {
        executeJest: true,
        executeLint: true,
        executeAudit: true,
        executePack: true,
        executeFormat: true,
        packageJson: { eliware: { apply: ["general", "application", "npm-published"] } },
      },
    ),
  ).toThrow("executePack (E-1.140.1)");
});

test("allows an explicitly exempted stage owner", () => {
  expect(() =>
    validateRequiredStagePlan([], { executeAudit: true }, new Set(["E-1.20.19"])),
  ).not.toThrow();
});

test("does not require aggregate stage owners during a validated focused run", () => {
  expect(() =>
    validateRequiredStagePlan([], {
      executeAudit: true,
      executeFormat: true,
      jestArgs: ["tests/example.test.mjs"],
      focusedScope: { testPath: "tests/example.test.mjs" },
    }),
  ).not.toThrow();
});

test("does not let an unresolved positional Jest argument bypass stage ownership", () => {
  expect(() =>
    validateRequiredStagePlan([], {
      executeAudit: true,
      jestArgs: ["tests/example.test.mjs", "extra-positional"],
    }),
  ).toThrow("executeAudit (E-1.20.19)");
});
