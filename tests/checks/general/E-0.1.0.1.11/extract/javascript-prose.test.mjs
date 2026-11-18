import { expect, test } from "@jest/globals";
import extractJavaScriptProse from "../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose.mjs";
test("combines comment extraction and output context collection", () => {
  expect(extractJavaScriptProse('// Choose an option.\nconsole.error("Request failed.");')).toEqual(
    [
      { text: " Choose an option.", line: 1, kind: "prose" },
      { text: "Request failed.", line: 2, kind: "prose" },
    ],
  );
});
test("skips invalid source because lint reports parse errors", () => {
  expect(extractJavaScriptProse("const =")).toEqual([]);
});
