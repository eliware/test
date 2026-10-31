import { expect, test } from "@jest/globals";
import { validateJestSettings } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/settings.mjs";

const validSettings = {
  collectCoverageFrom: ["src/**/*.mjs"],
  coverageReporters: ["text", "json-summary"],
  coverageThreshold: {},
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.mjs"],
};

test("accepts the required Jest settings", () => {
  expect(validateJestSettings(validSettings)).toEqual([]);
});

test("reports extra keys and changed Jest settings", () => {
  const errors = validateJestSettings({
    ...validSettings,
    extra: true,
    testEnvironment: "jsdom",
    testMatch: [],
    collectCoverageFrom: [],
    coverageReporters: [],
  });

  expect(errors).toEqual([
    "package.json Jest settings must use only the required configuration keys.",
    'Jest testEnvironment must be "node".',
    'Jest testMatch must be ["**/tests/**/*.test.mjs"].',
    'Jest collectCoverageFrom must be ["src/**/*.mjs"].',
    'Jest coverageReporters must be ["text", "json-summary"].',
  ]);
});
