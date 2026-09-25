import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectEnvironmentReferences } from "../../../../../src/checks/general/E-1/E-1.20/environment-ast-analysis.mjs";

test("collects direct, aliased, and destructured environment references", () => {
  const ast = parse('const env = process.env; const { PORT } = process.env; env.HOST; process.env["TOKEN"];', { sourceType: "module" });
  const variables = new Set();
  collectEnvironmentReferences(ast, new Set(), variables);
  expect([...variables].sort()).toEqual(["HOST", "PORT", "TOKEN"]);
});

test("ignores absent and non-object AST nodes", () => {
  const aliases = new Set();
  const variables = new Set();
  collectEnvironmentReferences(null, aliases, variables);
  collectEnvironmentReferences("not an AST node", aliases, variables);
  expect(aliases).toEqual(new Set());
  expect(variables).toEqual(new Set());
});
