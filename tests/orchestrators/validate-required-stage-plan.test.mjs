import { expect, test } from "@jest/globals";
import { validateRequiredStagePlan } from "../../src/orchestrators/validate-required-stage-plan.mjs";

test("accepts all enabled stage owners", () => {
  const ids = ["E-0.1.130.13", "E-0.1.4", "E-0.1.20.19", "E-0.1.140.1", "E-0.1.20.17"];
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
  const ids = ["E-0.1.130.13", "E-0.1.4", "E-0.1.20.19", "E-0.1.20.17"];
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
  const ids = ["E-0.1.130.13", "E-0.1.4", "E-0.1.20.19", "E-0.1.20.17"];
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
  ).toThrow("executePack (E-0.1.140.1)");
});

test("an exempted stage owner does not waive unrelated required stage owners", () => {
  expect(() =>
    validateRequiredStagePlan(
      [{ ruleId: "E-0.1.20.19" }],
      { executeAudit: true, executeLint: true },
      new Set(["E-0.1.20.19"]),
    ),
  ).toThrow("executeLint (E-0.1.4)");
});

test("requires an unexempted owner for each enabled validation stage", () => {
  expect(() =>
    validateRequiredStagePlan(
      [{ ruleId: "E-0.1.130.13" }],
      { executeJest: true },
      new Set(["E-0.1.130.13"]),
    ),
  ).toThrow("executeJest (E-0.1.130.13, E-0.1.40.15)");
});

test("treats an exempted parent as an exempted validation-stage owner", () => {
  expect(() =>
    validateRequiredStagePlan(
      [
        { ruleId: "E-0.1.130", parentRuleId: "E-0.1" },
        { ruleId: "E-0.1.130.13", parentRuleId: "E-0.1.130" },
      ],
      { executeJest: true },
      new Set(["E-0.1.130"]),
    ),
  ).toThrow("executeJest (E-0.1.130.13, E-0.1.40.15)");
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
  ).toThrow("executeAudit (E-0.1.20.19)");
});
