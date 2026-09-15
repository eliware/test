import { expect, test } from "@jest/globals";
import { createValidationRunOptions } from "../../src/cli/create-validation-run-options.mjs";

test("creates validation options from diagnostics and CLI settings", () => {
  const timing = {};
  const write = () => {};
  expect(createValidationRunOptions(["--debug-timing"], { mode: null, jestArgs: [] }, {}, timing, write))
    .toEqual(expect.objectContaining({
      executeJest: true,
      executeLint: true,
      executeAudit: true,
      executePack: true,
      executePackageChecks: true,
      executeFormat: true,
      timing,
      writeOutput: write,
    }));
});

test("disables Jest for a package-validation mode", () => {
  expect(createValidationRunOptions([], { mode: "audit", jestArgs: ["--audit"] }, { executeJest: true }, {}, undefined))
    .toEqual(expect.objectContaining({ executeJest: false, mode: "audit", modeRuleId: "E-1.20.19" }));
});

test("keeps aggregate package stages enabled when Jest execution is independently disabled", () => {
  expect(createValidationRunOptions([], { mode: null, jestArgs: [] }, { executeJest: false }, {}, undefined))
    .toEqual(expect.objectContaining({ executeJest: false, executePackageChecks: true, mode: null }));
});
