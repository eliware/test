import { expect, test } from "@jest/globals";
import { resolveValidationStageOptions } from "../../src/cli/resolve-validation-stage-options.mjs";

test("keeps focused lint and formatting enabled while disabling aggregate stages", () => {
  expect(resolveValidationStageOptions(
    { mode: null, jestArgs: ["tests/example.test.mjs"] },
    {},
  )).toEqual({
    executeJest: true,
    executeLint: true,
    executeAudit: false,
    executePack: false,
    executePackageChecks: false,
    executeFormat: true,
    mode: null,
    modeRuleId: null,
  });
});
