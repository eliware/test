import { expect, test } from "@jest/globals";
import { classifyStaticAstDependencyReference } from "../../../../../src/checks/general/E-0.1/E-0.1.20/classify-static-ast-dependency-reference.mjs";

function classify(node) {
  const referenced = new Set();
  classifyStaticAstDependencyReference(node, ["alpha", "beta"], referenced);
  return referenced;
}

test("classifies static import and export specifiers", () => {
  expect(classify({ type: "ImportDeclaration", source: { value: "alpha/subpath" } })).toEqual(
    new Set(["alpha"]),
  );
  expect(classify({ type: "ExportAllDeclaration", source: { value: "beta" } })).toEqual(
    new Set(["beta"]),
  );
  expect(classify({ type: "ImportDeclaration", source: { value: "unrelated" } })).toEqual(
    new Set(),
  );
});

test("classifies explicit package resolver calls", () => {
  expect(
    classify({
      type: "CallExpression",
      callee: { type: "Identifier", name: "resolvePackage" },
      arguments: [{ value: "beta/package.json" }],
    }),
  ).toEqual(new Set(["beta"]));
  expect(
    classify({
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "require" },
        property: { type: "Identifier", name: "resolve" },
      },
      arguments: [{ value: "alpha" }],
    }),
  ).toEqual(new Set(["alpha"]));
  const shadowed = new Set();
  classifyStaticAstDependencyReference(
    {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "require" },
        property: { type: "Identifier", name: "resolve" },
      },
      arguments: [{ value: "alpha" }],
    },
    ["alpha"],
    shadowed,
    true,
  );
  expect(shadowed).toEqual(new Set());
});
