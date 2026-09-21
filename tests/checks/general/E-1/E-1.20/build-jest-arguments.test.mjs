import { expect, test } from "@jest/globals";
import { buildJestArguments, focusedPathFrom } from "../../../../../src/checks/general/E-1/E-1.20/build-jest-arguments.mjs";

test("builds focused and default Jest argument lists", () => {
  expect(focusedPathFrom()).toBeUndefined();
  expect(focusedPathFrom(["--watch", "tests/sample.test.mjs"])).toBe("tests/sample.test.mjs");
  expect(buildJestArguments([])).toEqual(["--coverage", "--runInBand"]);
  expect(buildJestArguments(undefined)).toEqual(["--coverage", "--runInBand"]);
  expect(buildJestArguments(["tests/sample.test.mjs", "--debug-timing"])).toEqual([
    "--coverage", "--json", "--runTestsByPath", "tests/sample.test.mjs", "--runInBand",
  ]);
  expect(buildJestArguments([
    "tests/sample.test.mjs",
    "--ignore-100x4",
    "--ignore-monolith-limits",
    "--debug-timing",
    "--watch",
  ])).toEqual([
    "--coverage", "--json", "--runTestsByPath", "tests/sample.test.mjs", "--runInBand", "--watch",
  ]);
});
