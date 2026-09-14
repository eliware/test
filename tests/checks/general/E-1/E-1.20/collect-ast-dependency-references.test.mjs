import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectAstReferences } from "../../../../../src/checks/general/E-1/E-1.20/collect-ast-dependency-references.mjs";

test("collects static imports, exports, dynamic imports, and requires", () => {
  const referenced = new Set();
  const ast = parse(`export { value } from "alpha"; export * from "beta/subpath"; import("gamma"); import(dynamicName); require("delta"); require(dynamicName);`, { sourceType: "unambiguous" });
  const uncertain = { value: false };
  collectAstReferences(ast, ["alpha", "beta", "gamma", "delta"], referenced, uncertain);
  expect([...referenced].sort()).toEqual(["alpha", "beta", "delta", "gamma"]);
  expect(uncertain.value).toBe(true);
});

test("handles non-reference AST values and dynamic specifiers", () => {
  const referenced = new Set();
  const uncertain = { value: false };
  collectAstReferences(null, ["alpha"], referenced, uncertain);
  collectAstReferences("not an AST node", ["alpha"], referenced, uncertain);
  collectAstReferences({ type: "ImportExpression", source: { type: "NumericLiteral", value: 1 } }, ["alpha"], referenced, uncertain);
  collectAstReferences({ type: "CallExpression", callee: { type: "Identifier", name: "require" }, arguments: [{ type: "NumericLiteral" }] }, ["alpha"], referenced, uncertain);
  expect([...referenced]).toEqual([]);
  expect(uncertain.value).toBe(true);
});

test("collects a static ImportExpression reference", () => {
  const referenced = new Set();
  collectAstReferences({ type: "ImportExpression", source: { type: "StringLiteral", value: "alpha/subpath" } }, ["alpha"], referenced);
  expect([...referenced]).toEqual(["alpha"]);
});

test("ignores non-string and undeclared dependency specifiers", () => {
  const referenced = new Set();
  collectAstReferences({ type: "ImportDeclaration", source: { type: "NumericLiteral", value: 1 } }, ["alpha"], referenced);
  collectAstReferences({ type: "Program", body: [{ type: "ImportExpression", source: { type: "StringLiteral", value: "unknown" } }, { type: "CallExpression", callee: { type: "Import" }, arguments: [{ type: "StringLiteral", value: "unknown" }] }, { type: "CallExpression", callee: { type: "Identifier", name: "require" }, arguments: [{ type: "StringLiteral", value: "unknown" }] }] }, ["alpha"], referenced);
  expect([...referenced]).toEqual([]);
});
