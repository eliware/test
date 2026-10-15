import { expect, test } from "@jest/globals";
import { collectBlockShadowedJestNames } from "../../../../../src/checks/application/E-0.1.4.1.2/collect/block-shadowed-jest-names.mjs";

test("collects block-local Jest and callback shadows", () => {
  const block = {
    body: [
      {
        type: "VariableDeclaration",
        kind: "let",
        declarations: [{ id: { type: "Identifier", name: "test" }, init: null }],
      },
      {
        type: "VariableDeclaration",
        kind: "const",
        declarations: [{ id: { type: "Identifier", name: "verify" }, init: { type: "Literal" } }],
      },
    ],
  };
  const names = {
    callbacks: new Set(["test"]),
    namespaces: new Set(),
    describes: new Set(["describe"]),
  };

  expect(collectBlockShadowedJestNames(block, names, new Set(["verify"]))).toEqual({
    tests: new Set(["test"]),
    callbacks: new Set(["verify"]),
    describes: new Set(),
  });
});

test("collects block function and class shadows", () => {
  const block = {
    body: [
      { type: "FunctionDeclaration", id: { name: "test" } },
      { type: "ClassDeclaration", id: { name: "describe" } },
    ],
  };
  const names = {
    callbacks: new Set(["test"]),
    namespaces: new Set(),
    describes: new Set(["describe"]),
  };
  expect(collectBlockShadowedJestNames(block, names, new Set())).toEqual({
    tests: new Set(["test"]),
    callbacks: new Set(),
    describes: new Set(["describe"]),
  });
});

test("ignores block declarations without a binding name", () => {
  const block = { body: [{ type: "FunctionDeclaration", id: null }] };
  expect(
    collectBlockShadowedJestNames(
      block,
      { callbacks: new Set(), namespaces: new Set(), describes: new Set() },
      new Set(),
    ).tests,
  ).toEqual(new Set());
});
