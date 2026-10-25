import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectJavaScriptOutputProse } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/javascript-output.mjs";

test("collects prose from user-facing calls, properties, and attributes", () => {
  const ast = parse(
    'console.log("Printed"); element.textContent = "Ready"; element.setAttribute("title", "Open"); element.className = "machine";',
    { sourceType: "module" },
  ).program;
  const blocks = [];

  for (const statement of ast.body) collectJavaScriptOutputProse(statement.expression, blocks);

  expect(blocks.map(({ text }) => text)).toEqual(["Printed", "Ready", "Open"]);
});
