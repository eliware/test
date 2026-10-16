import { expect, test } from "@jest/globals";
import { getJestStageFailureCode } from "../../../../../../../src/validation/stages/jest/execution/run/jest/failure-code.mjs";

test.each([
  [{ status: "pass", message: "" }, "", 0],
  [{ status: "fail", message: "could not be started" }, "", 1],
  [{ status: "fail", message: "Jest failed" }, "coverage threshold not met", 4],
  [{ status: "fail", message: "Jest failed" }, "ordinary failure", 2],
])("classifies Jest stage result as code %i", (result, output, expected) => {
  expect(getJestStageFailureCode(result, output)).toBe(expected);
});
