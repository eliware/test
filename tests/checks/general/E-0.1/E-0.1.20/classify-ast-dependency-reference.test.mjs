import { expect, test } from "@jest/globals";
import { classifyAstDependencyReference } from "../../../../../src/checks/general/E-0.1/E-0.1.20/classify-ast-dependency-reference.mjs";

function classify(node, declared = ["alpha", "beta"]) {
  const referenced = new Set();
  const uncertain = { value: false };
  classifyAstDependencyReference(node, declared, referenced, uncertain, false);
  return { referenced: [...referenced], uncertain: uncertain.value };
}

test("classifies static import, export, dynamic import, and require references", () => {
  expect(classify({ type: "ImportDeclaration", source: { value: "alpha/subpath" } }).referenced).toEqual(["alpha"]);
  expect(classify({ type: "ExportAllDeclaration", source: { value: "beta" } }).referenced).toEqual(["beta"]);
  expect(classify({ type: "ImportExpression", source: { type: "StringLiteral", value: "alpha" } }).referenced).toEqual(["alpha"]);
  expect(classify({ type: "CallExpression", callee: { type: "Import" }, arguments: [{ type: "StringLiteral", value: "beta" }] }).referenced).toEqual(["beta"]);
  expect(classify({ type: "CallExpression", callee: { type: "Identifier", name: "require" }, arguments: [{ type: "StringLiteral", value: "alpha" }] }).referenced).toEqual(["alpha"]);
  expect(classify({ type: "CallExpression", callee: { type: "Identifier", name: "resolvePackage" }, arguments: [{ value: "beta/package.json" }] }).referenced).toEqual(["beta"]);
  expect(classify({ type: "CallExpression", callee: { type: "MemberExpression", object: { type: "Identifier", name: "require" }, property: { type: "Identifier", name: "resolve" } }, arguments: [{ value: "alpha" }] }).referenced).toEqual(["alpha"]);
});

test("marks only dynamic specifiers that may construct a declared dependency", () => {
  const template = { type: "TemplateLiteral", quasis: [{ value: { raw: "alpha/" } }] };
  const binary = { type: "BinaryExpression", left: { type: "StringLiteral", value: "beta/" }, right: { type: "Identifier", name: "suffix" } };
  expect(classify({ type: "ImportExpression", source: template }).uncertain).toBe(true);
  expect(classify({ type: "CallExpression", callee: { type: "Import" }, arguments: [template] }).uncertain).toBe(true);
  expect(classify({ type: "CallExpression", callee: { type: "Identifier", name: "require" }, arguments: [binary] }).uncertain).toBe(true);
  expect(classify({ type: "CallExpression", callee: { type: "Import" }, arguments: [{ type: "Identifier", name: "path" }] }).uncertain).toBe(false);
  const nestedBinary = { type: "BinaryExpression", left: { type: "Identifier", name: "prefix" }, right: { type: "StringLiteral", value: "alpha/" } };
  expect(classify({ type: "ImportExpression", source: nestedBinary }).uncertain).toBe(true);
  expect(classify({ type: "ImportExpression", source: { type: "BinaryExpression", left: { type: "Identifier", name: "prefix" }, right: { type: "NumericLiteral", value: 1 } } }).uncertain).toBe(false);
  expect(classify({ type: "ImportExpression", source: { type: "StringLiteral", value: "other" } }).uncertain).toBe(false);
  expect(classify({ type: "ImportExpression", source: { type: "TemplateLiteral", quasis: [{ value: { raw: "other/" } }] } }).uncertain).toBe(false);
});

test("ignores require references that the scope analyzer marks as shadowed", () => {
  const referenced = new Set();
  const uncertain = { value: false };
  classifyAstDependencyReference({ type: "CallExpression", callee: { type: "Identifier", name: "require" }, arguments: [{ type: "StringLiteral", value: "alpha" }] }, ["alpha"], referenced, uncertain, true);
  expect(referenced).toEqual(new Set());
});

test("ignores unsupported reference syntax", () => {
  const referenced = new Set();
  const uncertain = { value: false };
  classifyAstDependencyReference({ type: "CallExpression", callee: { type: "MemberExpression", object: { type: "Identifier", name: "require" }, property: { type: "Identifier", name: "resolve" }, computed: true }, arguments: [{ type: "StringLiteral", value: "alpha" }] }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "ImportExpression", source: { type: "NumericLiteral", value: 1 } }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "ImportDeclaration", source: {} }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "ImportDeclaration" }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "ExportNamedDeclaration", source: { value: "other" } }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "CallExpression", callee: { type: "Identifier", name: "require" } }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "CallExpression", callee: { type: "Import" }, arguments: [] }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "CallExpression", callee: { type: "Identifier", name: "resolvePackage" } }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "CallExpression", callee: { type: "Identifier", name: "noop" }, arguments: [] }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "CallExpression" }, ["alpha"], referenced, uncertain, false);
  classifyAstDependencyReference({ type: "CallExpression", callee: { type: "MemberExpression", object: { type: "Identifier", name: "require" }, property: { type: "Identifier", name: "resolve" } } }, ["alpha"], referenced, uncertain, false);
  expect(referenced).toEqual(new Set());
  expect(uncertain.value).toBe(false);
});
