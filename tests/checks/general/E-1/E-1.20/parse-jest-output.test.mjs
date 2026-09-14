import { expect, test } from "@jest/globals";
import { parseJsonOutput } from "../../../../../src/checks/general/E-1/E-1.20/parse-jest-output.mjs";

test("parses valid Jest JSON and preserves malformed or absent JSON as text", () => {
  expect(parseJsonOutput("prefix{\"numFailedTestSuites\":0}")).toEqual({
    text: "prefix", report: { numFailedTestSuites: 0 },
  });
  expect(parseJsonOutput("noise\nnoise\n{not-json}")).toEqual({
    text: "noise\nnoise\n{not-json}", report: null,
  });
  expect(parseJsonOutput("plain")).toEqual({ text: "plain", report: null });
});
