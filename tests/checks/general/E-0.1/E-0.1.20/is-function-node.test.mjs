import { expect, test } from "@jest/globals";
import { isFunctionNode } from "../../../../../src/checks/general/E-0.1/E-0.1.20/is-function-node.mjs";

test("recognizes each function AST node type", () => {
  for (const type of [
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
    "ObjectMethod",
    "ClassMethod",
    "ClassPrivateMethod",
  ])
    expect(isFunctionNode({ type })).toBe(true);
});

test("rejects missing and non-function nodes", () => {
  expect(isFunctionNode(null)).toBe(false);
  expect(isFunctionNode({ type: "BlockStatement" })).toBe(false);
});
