import { expect, test } from "@jest/globals";
import { validateRunnerConfiguration } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/metadata/runner-configuration.mjs";

test.each([
  "ava",
  "@bcoe/v8-coverage",
  "c8",
  "cypress",
  "jasmine",
  "nightwatch",
  "protractor",
  "karma",
  "mocha",
  "nyc",
  "playwright",
  "qunit",
  "tap",
  "tape",
  "uvu",
  "vitest",
  "webdriverio",
  "testcafe",
  "istanbul",
  "coverage",
  "nodeTestRunner",
  "testRunner",
  "test-runner",
])("rejects a %s package configuration field", (field) => {
  expect(validateRunnerConfiguration({ [field]: {} })).toEqual([
    "package.json must not configure a separate test runner or coverage engine.",
  ]);
});

test("accepts package metadata without runner configuration fields", () => {
  expect(validateRunnerConfiguration({ name: "@eliware/example", scripts: {} })).toEqual([]);
  expect(validateRunnerConfiguration()).toEqual([]);
});
