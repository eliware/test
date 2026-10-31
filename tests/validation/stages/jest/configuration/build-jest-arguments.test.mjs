import { expect, test } from "@jest/globals";
import {
  buildJestArguments,
  focusedPathFrom,
} from "../../../../../src/validation/stages/jest/configuration/build-jest-arguments.mjs";

test("builds focused and default Jest argument lists", () => {
  expect(focusedPathFrom()).toBeUndefined();
  expect(focusedPathFrom(["--watch", "tests/sample.test.mjs"])).toBe("tests/sample.test.mjs");
  expect(buildJestArguments([])).toEqual(["--coverage", "--no-cache"]);
  expect(buildJestArguments(undefined)).toEqual(["--coverage", "--no-cache"]);
  expect(buildJestArguments(["tests/sample.test.mjs", "--debug-timing"])).toEqual([
    "--coverage",
    "--runTestsByPath",
    "tests/sample.test.mjs",
    "--no-cache",
  ]);
  expect(buildJestArguments(["tests/sample.test.mjs", "--debug-timing", "--watch"])).toEqual([
    "--coverage",
    "--runTestsByPath",
    "tests/sample.test.mjs",
    "--no-cache",
    "--watch",
  ]);
  expect(buildJestArguments(["tests/one.test.mjs", "tests/two.test.mjs"])).toEqual([
    "--coverage",
    "--runTestsByPath",
    "tests/one.test.mjs",
    "tests/two.test.mjs",
    "--no-cache",
  ]);
});

test("allows serial execution and open-handle detection when requested", () => {
  expect(buildJestArguments(["--runInBand", "--detectOpenHandles"])).toEqual([
    "--coverage",
    "--no-cache",
    "--runInBand",
    "--detectOpenHandles",
  ]);
  expect(buildJestArguments(["--detectOpenHandles=false"])).toEqual([
    "--coverage",
    "--no-cache",
    "--detectOpenHandles=false",
  ]);
});

test("rejects extra focused test paths forwarded after the separator", () => {
  expect(() => buildJestArguments(["tests/sample.test.mjs", "--", "tests/other.test.mjs"])).toThrow(
    "before the -- separator",
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
  ["--cache"],
  ["--no-cache"],
])("rejects forwarded wrapper-owned Jest options: %s", (...args) => {
  expect(() => buildJestArguments(args)).toThrow("controlled by eliware-test");
});
