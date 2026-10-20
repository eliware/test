import { expect, test } from "@jest/globals";
import { collectLocalShadowedJestNames } from "../../../../../../src/checks/application/E-0.1.4.1.2/collect/shadowed-jest-names/local-bindings.mjs";

function result() {
  return { tests: new Set(), callbacks: new Set(), describes: new Set() };
}

test("collects shadows from local bindings and assignments", () => {
  const shadowed = result();
  collectLocalShadowedJestNames(
    [
      { type: "VariableDeclarator", id: { type: "Identifier", name: "test" } },
      { type: "AssignmentExpression", left: { type: "Identifier", name: "callback" } },
    ],
    { callbacks: new Set(["test"]), namespaces: new Set(), describes: new Set() },
    new Set(["callback"]),
    shadowed,
  );
  expect(shadowed).toEqual({
    tests: new Set(["test"]),
    callbacks: new Set(["callback"]),
    describes: new Set(),
  });
});

test("tracks function bindings and ignores nested block declarations", () => {
  const shadowed = result();
  collectLocalShadowedJestNames(
    [
      {
        type: "FunctionDeclaration",
        id: { name: "test" },
      },
      {
        type: "BlockStatement",
        body: [{ type: "FunctionDeclaration", id: { name: "jest" } }],
      },
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "describe" },
        init: { type: "ArrowFunctionExpression" },
      },
    ],
    {
      callbacks: new Set(["test"]),
      namespaces: new Set(["jest"]),
      describes: new Set(["describe"]),
    },
    new Set(),
    shadowed,
  );
  expect(shadowed).toEqual({
    tests: new Set(["test"]),
    callbacks: new Set(),
    describes: new Set(["describe"]),
  });
});

test("does not descend into nested functions", () => {
  const shadowed = result();
  collectLocalShadowedJestNames(
    { type: "ArrowFunctionExpression", body: { type: "Identifier", name: "test" } },
    { callbacks: new Set(["test"]), namespaces: new Set(), describes: new Set() },
    new Set(),
    shadowed,
  );
  expect(shadowed).toEqual(result());
});
