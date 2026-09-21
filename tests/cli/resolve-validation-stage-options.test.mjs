import { expect, test } from "@jest/globals";
import { resolveValidationStageOptions } from "../../src/cli/resolve-validation-stage-options.mjs";

test("disables aggregate stages for focused Jest execution", () => {
  expect(resolveValidationStageOptions(
    { mode: null, jestArgs: ["tests/example.test.mjs"] },
    {},
  )).toEqual({
    executeJest: true,
    executeLint: false,
    executeAudit: false,
    executePack: false,
    executePackageChecks: false,
    executeFormat: false,
    mode: null,
    modeRuleId: null,
  });
});
