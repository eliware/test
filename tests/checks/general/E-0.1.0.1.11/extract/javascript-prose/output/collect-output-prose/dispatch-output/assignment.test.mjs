import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import dispatchOutputAssignment from "../../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/collect-output-prose/dispatch-output/assignment.mjs";
test("dispatches assignments to property prose collection", () => {
  const expression = parse('element.textContent = "Ready";', { sourceType: "module" }).program
    .body[0].expression;
  const blocks = [];
  dispatchOutputAssignment(expression, blocks);
  expect(blocks.map(({ text }) => text)).toEqual(["Ready"]);
});
test("ignores non-assignment expressions", () => {
  const blocks = [];
  dispatchOutputAssignment({ type: "Identifier", name: "value" }, blocks);
  expect(blocks).toEqual([]);
});
