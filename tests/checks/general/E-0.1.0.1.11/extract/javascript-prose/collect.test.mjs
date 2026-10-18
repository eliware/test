import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectJavaScriptProse } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/collect.mjs";

test("collects user-facing text from JSX and output calls", () => {
  const ast = parse(
    '<button title="Open settings">Show settings</button>; console.log("Request failed."); element.textContent = "Ready."; element.setAttribute("aria-label", "Select record");',
    { sourceType: "module", plugins: ["jsx"] },
  ).program;

  expect(collectJavaScriptProse(ast)).toEqual([
    { text: "Open settings", line: 1, kind: "prose" },
    { text: "Show settings", line: 1, kind: "prose" },
    { text: "Request failed.", line: 1, kind: "prose" },
    { text: "Ready.", line: 1, kind: "prose" },
    { text: "Select record", line: 1, kind: "prose" },
  ]);
});

test("returns no text for missing nodes and ignores non-user-facing attributes", () => {
  const ast = parse('<button className="machine value">Save</button>;', {
    sourceType: "module",
    plugins: ["jsx"],
  }).program;

  expect(collectJavaScriptProse(null)).toEqual([]);
  expect(collectJavaScriptProse(ast)).toEqual([{ text: "Save", line: 1, kind: "prose" }]);
});
