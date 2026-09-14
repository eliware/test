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
    .toEqual(expect.objectContaining({ executeJest: false, mode: "audit" }));
});
