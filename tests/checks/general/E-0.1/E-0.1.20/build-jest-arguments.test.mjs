import { expect, test } from "@jest/globals";
import { buildJestArguments, focusedPathFrom } from "../../../../../src/checks/general/E-0.1/E-0.1.20/build-jest-arguments.mjs";

test("builds focused and default Jest argument lists", () => {
  expect(focusedPathFrom()).toBeUndefined();
  expect(focusedPathFrom(["--watch", "tests/sample.test.mjs"])).toBe("tests/sample.test.mjs");
  expect(buildJestArguments([])).toEqual(["--coverage", "--runInBand"]);
  expect(buildJestArguments(undefined)).toEqual(["--coverage", "--runInBand"]);
  expect(buildJestArguments(["tests/sample.test.mjs", "--debug-timing"])).toEqual([
    "--coverage", "--json", "--runTestsByPath", "tests/sample.test.mjs", "--runInBand",
  ]);
  expect(buildJestArguments(["tests/sample.test.mjs", "--debug-timing", "--watch"])).toEqual([
    "--coverage", "--json", "--runTestsByPath", "tests/sample.test.mjs", "--runInBand", "--watch",
  ]);
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
])("rejects forwarded wrapper-owned Jest options: %s", (...args) => {
  expect(() => buildJestArguments(args)).toThrow("controlled by eliware-test");
});
