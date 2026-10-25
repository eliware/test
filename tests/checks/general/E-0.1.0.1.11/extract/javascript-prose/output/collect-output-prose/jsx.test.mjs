import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectJsxProse } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/jsx.mjs";

test("collects visible JSX text and supported attributes only", () => {
  const ast = parse('<button title="Open" className="machine">Visible</button>', {
    sourceType: "module",
    plugins: ["jsx"],
  }).program.body[0].expression;
  const blocks = [];

  expect(collectJsxProse(ast.children[0], blocks)).toBe(false);
  expect(collectJsxProse(ast.openingElement.attributes[0], blocks)).toBe(false);
  expect(collectJsxProse(ast.openingElement.attributes[1], blocks)).toBe(false);
  expect(blocks.map(({ text }) => text)).toEqual(["Visible", "Open"]);
});
