import { expect, test } from "@jest/globals";
import { recordJestContext } from "../../../../../src/validation/stages/jest/execution/record-jest-context.mjs";

test("records the Jest result and coverage directory", () => {
  const context = {};
  const result = { code: 0, stdout: "ok", stderr: "", coverageDirectory: "coverage" };
  expect(recordJestContext(context, result)).toBe(context);
  expect(context.jestResult).toBe(result);
  expect(context.jestCoverageDirectory).toBe("coverage");
});

test("records the result when timing is unavailable", () => {
  const result = { code: 0, stdout: "plain", stderr: "" };
  expect(recordJestContext({}, result).jestResult).toBe(result);
});
