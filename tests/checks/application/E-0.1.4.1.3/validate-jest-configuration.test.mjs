import { expect, test } from "@jest/globals";
import { validateJestConfiguration } from "../../../../src/checks/application/E-0.1.4.1.3/validate-jest-configuration.mjs";

test("requires Jest configuration and reports changed settings", () => {
  expect(validateJestConfiguration({})).toEqual(["package.json must define Jest configuration."]);
  const errors = validateJestConfiguration({
    jest: {
      testEnvironment: "jsdom",
      testMatch: [],
      collectCoverageFrom: [],
      coverageReporters: [],
      coverageThreshold: {},
    },
  });
  expect(errors).toHaveLength(10);
  expect(errors).toContain("Jest global statements coverage must be 100 percent.");
});

test("accepts the required node, test, and Istanbul settings", () => {
  expect(
    validateJestConfiguration({
      jest: {
        testEnvironment: "node",
        testMatch: ["**/tests/**/*.test.mjs"],
        collectCoverageFrom: ["src/**/*.mjs"],
        coverageReporters: ["text", "json-summary"],
        coverageThreshold: {
          global: { branches: 100, functions: 100, lines: 100, statements: 100 },
        },
      },
    }),
  ).toEqual([]);
});
