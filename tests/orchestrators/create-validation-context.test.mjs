import { expect, test } from "@jest/globals";
import { createValidationContext } from "../../src/orchestrators/create-validation-context.mjs";

test("creates the complete execution context from validation options", () => {
  const timing = {};
  const writeOutput = () => {};
  expect(createValidationContext("root", { name: "fixture" }, {
    executeJest: true,
    executeLint: true,
    executeAudit: true,
    executePack: true,
    executePackageChecks: true,
    executeFormat: true,
    mode: "focused",
    jestArgs: ["tests/example.test.mjs"],
    timing,
    writeOutput,
  })).toEqual({
    root: "root",
    packageJson: { name: "fixture" },
    executeJest: true,
    executeLint: true,
    executeAudit: true,
    executePack: true,
    executePackageChecks: true,
    executeFormat: true,
    mode: "focused",
    jestArgs: ["tests/example.test.mjs"],
    timing,
    writeOutput,
  });
});

test("creates default options without enabling stages", () => {
  expect(createValidationContext("root", {})).toEqual({
    root: "root",
    packageJson: {},
    executeJest: false,
    executeLint: false,
    executeAudit: false,
    executePack: false,
    executePackageChecks: false,
    executeFormat: false,
    mode: null,
    jestArgs: [],
    timing: undefined,
    writeOutput: undefined,
  });
});
