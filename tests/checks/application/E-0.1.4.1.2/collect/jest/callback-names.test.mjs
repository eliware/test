import { expect, test } from "@jest/globals";
import { collectJestCallbackNames } from "../../../../../../src/checks/application/E-0.1.4.1.2/collect/jest/callback-names.mjs";

test("collects named function and variable callbacks recursively", () => {
  const ast = {
    type: "Program",
    body: [
      { type: "FunctionDeclaration", id: { name: "declared" } },
      { type: "FunctionDeclaration", id: null },
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "arrow" },
        init: { type: "ArrowFunctionExpression" },
      },
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "expression" },
        init: { type: "FunctionExpression" },
      },
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "value" },
        init: { type: "Literal" },
      },
      {
        type: "VariableDeclarator",
        id: { type: "ObjectPattern" },
        init: { type: "ArrowFunctionExpression" },
      },
    ],
  };

  expect(collectJestCallbackNames(ast)).toEqual(new Set(["declared", "arrow", "expression"]));
});

test("returns no names for empty or missing syntax nodes", () => {
  expect(collectJestCallbackNames([null, { type: "Program", body: [] }])).toEqual(new Set());
  expect(collectJestCallbackNames(undefined)).toEqual(new Set());
});
