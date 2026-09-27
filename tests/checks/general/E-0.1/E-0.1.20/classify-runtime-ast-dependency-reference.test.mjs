import { expect, test } from "@jest/globals";
import { classifyRuntimeAstDependencyReference } from "../../../../../src/checks/general/E-0.1/E-0.1.20/classify-runtime-ast-dependency-reference.mjs";

function classify(node, requireShadowed = false) {
  const referenced = new Set();
  const uncertain = { value: false };
  classifyRuntimeAstDependencyReference(
    node,
    ["alpha", "beta"],
    referenced,
    uncertain,
    requireShadowed,
  );
  return { referenced, uncertain: uncertain.value };
}

test("classifies dynamic import and unshadowed require calls", () => {
  expect(
    classify({ type: "ImportExpression", source: { type: "StringLiteral", value: "alpha" } })
      .referenced,
  ).toEqual(new Set(["alpha"]));
  expect(
    classify({
      type: "CallExpression",
      callee: { type: "Import" },
      arguments: [{ type: "StringLiteral", value: "beta" }],
    }).referenced,
  ).toEqual(new Set(["beta"]));
  expect(
    classify({
      type: "CallExpression",
      callee: { type: "Identifier", name: "require" },
      arguments: [{ type: "StringLiteral", value: "alpha" }],
    }).referenced,
  ).toEqual(new Set(["alpha"]));
});

test("marks constructed specifiers uncertain and ignores shadowed require", () => {
  expect(
    classify({
      type: "ImportExpression",
      source: { type: "TemplateLiteral", quasis: [{ value: { raw: "alpha/" } }] },
    }).uncertain,
  ).toBe(true);
  expect(
    classify(
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "require" },
        arguments: [{ type: "StringLiteral", value: "alpha" }],
      },
      true,
    ).referenced,
  ).toEqual(new Set());
});

test("ignores unsupported and unrelated runtime references", () => {
  expect(
    classify({ type: "CallExpression", callee: { type: "Identifier", name: "other" } }),
  ).toEqual({ referenced: new Set(), uncertain: false });
  expect(
    classify({ type: "ImportExpression", source: { type: "StringLiteral", value: "unrelated" } }),
  ).toEqual({ referenced: new Set(), uncertain: false });
  expect(
    classify({ type: "ImportExpression", source: { type: "NumericLiteral", value: 1 } }),
  ).toEqual({ referenced: new Set(), uncertain: false });
});
