import { expect, test } from "@jest/globals";
import { parseJsonOutput } from "../../../../../src/checks/general/E-0.1/E-0.1.20/parse-jest-output.mjs";

test("parses valid Jest JSON and preserves malformed or absent JSON as text", () => {
  expect(parseJsonOutput("prefix{\"numFailedTestSuites\":0}")).toEqual({
    text: "prefix", report: { numFailedTestSuites: 0 },
  });
  expect(parseJsonOutput("noise\nnoise\n{not-json}")).toEqual({
    text: "noise\nnoise\n{not-json}", report: null,
  });
  expect(parseJsonOutput("plain")).toEqual({ text: "plain", report: null });
  expect(parseJsonOutput('{"numFailedTestSuites":}')).toEqual({
    text: '{"numFailedTestSuites":}', report: null,
  });
  expect(parseJsonOutput('"numFailedTestSuites": 0')).toEqual({
    text: '"numFailedTestSuites": 0', report: null,
  });
});

test("parses whitespace-prefixed pretty-printed Jest JSON", () => {
  const output = `progress\n  {\n    "numFailedTestSuites": 0,\n    "testResults": [{ "assertionResults": [] }]\n  }  `;
  expect(parseJsonOutput(output)).toEqual({
    text: "progress\n  ",
    report: { numFailedTestSuites: 0, testResults: [{ assertionResults: [] }] },
  });
});
