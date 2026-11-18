import { expect, test } from "@jest/globals";
import findSeparateTestRunnerConfigErrors from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/source/separate-config-errors.mjs";

test("reports separate runner configuration files", () => {
  expect(findSeparateTestRunnerConfigErrors(["jest.config.ts", "src/run.mjs"])).toEqual([
    "jest.config.ts is a separate test runner or coverage configuration file.",
  ]);
});

test("returns no errors when paths use the supported package configuration", () => {
  expect(findSeparateTestRunnerConfigErrors(["package.json", "src/run.mjs"])).toEqual([]);
});
