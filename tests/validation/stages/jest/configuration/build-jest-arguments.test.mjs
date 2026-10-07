import { expect, test } from "@jest/globals";
import {
  buildJestArguments,
  focusedPathFrom,
} from "../../../../../src/validation/stages/jest/configuration/build-jest-arguments.mjs";

test("builds focused and default Jest argument lists", () => {
  expect(focusedPathFrom()).toBeUndefined();
  expect(focusedPathFrom(["--watch", "tests/sample.test.mjs"])).toBe("tests/sample.test.mjs");
  expect(buildJestArguments([])).toEqual(["--coverage", "--runInBand"]);
  expect(buildJestArguments(undefined)).toEqual(["--coverage", "--runInBand"]);
  expect(buildJestArguments(["tests/sample.test.mjs", "--debug-timing"])).toEqual([
    "--coverage",
    "--runTestsByPath",
    "tests/sample.test.mjs",
    "--runInBand",
  ]);
  expect(buildJestArguments(["tests/sample.test.mjs", "--debug-timing", "--watch"])).toEqual([
    "--coverage",
    "--runTestsByPath",
    "tests/sample.test.mjs",
    "--runInBand",
    "--watch",
  ]);
});

test("rejects extra focused test paths forwarded after the separator", () => {
  expect(() => buildJestArguments(["tests/sample.test.mjs", "--", "tests/other.test.mjs"])).toThrow(
    "Only one focused test path",
  );
});

test.each([
  ["--coverage=false"],
  ["--no-coverage"],
  ["--coverageDirectory", "other"],
  ["--coverageReporters=json-summary"],
  ["--collectCoverageFrom", "src/other.mjs"],
  ["--reporters", "default"],
  ["--outputFile=result.json"],
  ["--json"],
  ["--runTestsByPath", "tests/other.test.mjs"],
  ["--testPathPattern=tests/other"],
  ["--collectCoverage=false"],
  ["--no-collectCoverage"],
  ["--test-path-patterns=tests/other"],
  ["-c", "jest.config.mjs"],
  ["--find-related-tests", "src/other.mjs"],
])("rejects forwarded wrapper-owned Jest options: %s", (...args) => {
  expect(() => buildJestArguments(args)).toThrow("controlled by eliware-test");
});
