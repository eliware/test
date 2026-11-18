import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import dispatchOutputCall from "../../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/dispatch-output/call.mjs";
test("dispatches call expressions to call and attribute collectors", () => {
  const expression = parse('console.log("Shown");', { sourceType: "module" }).program.body[0]
    .expression;
  const blocks = [];
  dispatchOutputCall(expression, blocks);
  expect(blocks.map(({ text }) => text)).toEqual(["Shown"]);
});
test("ignores non-call expressions", () => {
  const blocks = [];
  dispatchOutputCall({ type: "Identifier", name: "value" }, blocks);
  expect(blocks).toEqual([]);
});
