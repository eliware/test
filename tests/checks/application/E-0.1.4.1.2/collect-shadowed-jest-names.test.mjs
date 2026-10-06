import { expect, test } from "@jest/globals";
import { collectShadowedJestNames } from "../../../../src/checks/application/E-0.1.4.1.2/collect-shadowed-jest-names.mjs";

test("collects shadowed Jest names and local test callbacks", () => {
  const fn = {
    params: [{ type: "Identifier", name: "test" }],
    body: {
      type: "VariableDeclarator",
      id: { type: "Identifier", name: "it" },
      init: { type: "ArrowFunctionExpression" },
    },
  };
  const names = { callbacks: new Set(["test", "it"]), namespaces: new Set() };
  expect(collectShadowedJestNames(fn, names, new Set(["callback"]))).toEqual({
    tests: new Set(["test", "it"]),
    callbacks: new Set(),
  });
});

test("marks reassigned callbacks as shadowed", () => {
  const fn = {
    params: [],
    body: { type: "AssignmentExpression", left: { type: "Identifier", name: "callback" } },
  };
  expect(
    collectShadowedJestNames(
      fn,
      { callbacks: new Set(), namespaces: new Set() },
      new Set(["callback"]),
    ).callbacks,
  ).toEqual(new Set(["callback"]));
});

test("ignores unsupported parameters and shadows Jest names in nested declarations", () => {
  const names = { callbacks: new Set(["test", "callback"]), namespaces: new Set(["jest"]) };
  const fn = {
    params: [{ type: "ThisExpression" }, { type: "Identifier", name: "jest" }],
    body: [
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "test" },
        init: { type: "NumericLiteral" },
      },
      { type: "FunctionDeclaration", id: { name: "ignoredNested" }, params: [], body: [] },
    ],
  };
  expect(collectShadowedJestNames(fn, names, new Set(["callback"])).tests).toEqual(
    new Set(["jest", "test"]),
  );
});

test("handles missing parameters and assignments to Jest names", () => {
  const names = { callbacks: new Set(["test"]), namespaces: new Set(["jest"]) };
  expect(collectShadowedJestNames({ body: [] }, names, new Set()).tests).toEqual(new Set());
  const result = collectShadowedJestNames(
    {
      body: [
        { type: "AssignmentExpression", left: { type: "Identifier", name: "test" } },
        { type: "AssignmentExpression", left: { type: "Identifier", name: "jest" } },
      ],
    },
    names,
    new Set(["callback"]),
  );
  expect(result.tests).toEqual(new Set(["test", "jest"]));
  expect(result.callbacks).toEqual(new Set());
});

test("ignores function declarations that do not shadow Jest names", () => {
  const result = collectShadowedJestNames(
    {
      params: [],
      body: {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "local" },
        init: { type: "FunctionExpression" },
      },
    },
    { callbacks: new Set(["test"]), namespaces: new Set(["jest"]) },
    new Set(["callback"]),
  );
  expect(result).toEqual({ tests: new Set(), callbacks: new Set() });
});
