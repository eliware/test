import { expect, test } from "@jest/globals";
import { classifyAstDependencyReference } from "../../../../../src/checks/general/E-0.1/E-0.1.20/classify-ast-dependency-reference.mjs";

test("dispatches static and runtime references into a shared result", () => {
  const referenced = new Set();
  const uncertain = { value: false };
  classifyAstDependencyReference(
    { type: "ImportDeclaration", source: { value: "alpha/subpath" } },
    ["alpha", "beta"],
    referenced,
    uncertain,
    false,
  );
  classifyAstDependencyReference(
    { type: "ImportExpression", source: { type: "StringLiteral", value: "beta" } },
    ["alpha", "beta"],
    referenced,
    uncertain,
    false,
  );
  expect(referenced).toEqual(new Set(["alpha", "beta"]));
  expect(uncertain.value).toBe(false);
});

test("routes shadowing and uncertain dynamic syntax to runtime classification", () => {
  const referenced = new Set();
  const uncertain = { value: false };
  classifyAstDependencyReference(
    {
      type: "CallExpression",
      callee: { type: "Identifier", name: "require" },
      arguments: [{ type: "StringLiteral", value: "alpha" }],
    },
    ["alpha"],
    referenced,
    uncertain,
    true,
  );
  classifyAstDependencyReference(
    {
      type: "ImportExpression",
      source: { type: "TemplateLiteral", quasis: [{ value: { raw: "alpha/" } }] },
    },
    ["alpha"],
    referenced,
    uncertain,
    false,
  );
  expect(referenced).toEqual(new Set());
  expect(uncertain.value).toBe(true);
});
