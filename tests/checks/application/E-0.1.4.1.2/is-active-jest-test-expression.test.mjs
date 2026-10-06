import { expect, test } from "@jest/globals";
import { isActiveJestTestExpression } from "../../../../src/checks/application/E-0.1.4.1.2/is-active-jest-test-expression.mjs";

test.each(["test", "it"])("recognizes global %s calls", (name) => {
  expect(
    isActiveJestTestExpression(
      { type: "Identifier", name },
      { callbacks: new Set([name]), namespaces: new Set() },
    ),
  ).toBe(true);
});

test("recognizes chained test modifiers and rejects unrelated members", () => {
  const expression = {
    type: "MemberExpression",
    object: { type: "Identifier", name: "test" },
    property: { type: "Identifier", name: "only" },
  };
  expect(
    isActiveJestTestExpression(expression, { callbacks: new Set(["test"]), namespaces: new Set() }),
  ).toBe(true);
  expect(
    isActiveJestTestExpression(
      { type: "Identifier", name: "other" },
      { callbacks: new Set(), namespaces: new Set() },
    ),
  ).toBe(false);
});
