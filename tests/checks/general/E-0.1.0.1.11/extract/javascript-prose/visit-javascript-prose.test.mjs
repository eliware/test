import { expect, jest, test } from "@jest/globals";
import { visitJavaScriptProse } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/visit-javascript-prose.mjs";

test("visits nested nodes in order and skips parser metadata", () => {
  const types = [];
  const root = {
    type: "Program",
    body: [{ type: "ExpressionStatement", expression: { type: "StringLiteral" } }],
    loc: { type: "Location" },
    comments: [{ type: "Comment" }],
    tokens: [{ type: "Token" }],
  };
  visitJavaScriptProse(root, (node) => types.push(node.type));
  expect(types).toEqual(["Program", "ExpressionStatement", "StringLiteral"]);
});

test("ignores null and primitive values", () => {
  const visit = jest.fn();
  visitJavaScriptProse(null, visit);
  visitJavaScriptProse("source", visit);
  expect(visit).not.toHaveBeenCalled();
});
