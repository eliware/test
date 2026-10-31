import { expect, test } from "@jest/globals";
import { validateJestCoverageThreshold } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/coverage-threshold.mjs";

test("accepts all required global coverage metrics at 100 percent", () => {
  expect(
    validateJestCoverageThreshold({
      global: { branches: 100, functions: 100, lines: 100, statements: 100 },
    }),
  ).toEqual([]);
});

test("reports invalid threshold scope, metric keys, and values", () => {
  expect(
    validateJestCoverageThreshold({
      global: { branches: 99, functions: 100, lines: 100, statements: 100, extra: 100 },
      perFile: {},
    }),
  ).toEqual([
    "Jest coverageThreshold must define only global coverage.",
    "Jest global coverage must define only the four required metrics.",
    "Jest global branches coverage must be 100 percent.",
  ]);
});

test("reports missing global thresholds", () => {
  expect(validateJestCoverageThreshold({})).toEqual([
    "Jest coverageThreshold must define only global coverage.",
    "Jest global coverage must define only the four required metrics.",
    "Jest global branches coverage must be 100 percent.",
    "Jest global functions coverage must be 100 percent.",
    "Jest global lines coverage must be 100 percent.",
    "Jest global statements coverage must be 100 percent.",
  ]);
});

test("reports an absent coverage threshold object", () => {
  expect(validateJestCoverageThreshold(undefined)).toContain(
    "Jest coverageThreshold must define only global coverage.",
  );
});
