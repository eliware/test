import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectEnvironmentBindings } from "../../../../../src/checks/general/E-1/E-1.20/collect-environment-bindings.mjs";

test("collects aliases and uppercase destructured variables", () => {
  const ast = parse("const env = process.env; const { PORT, lower_value } = process.env;", { sourceType: "module" });
  const aliases = new Set();
  const variables = new Set();
  collectEnvironmentBindings(null, aliases, variables);
  for (const statement of ast.program.body) collectEnvironmentBindings(statement.declarations[0], aliases, variables);
  expect(aliases).toEqual(new Set(["env"]));
  expect(variables).toEqual(new Set(["PORT"]));
});

test("ignores unrelated declarations and rest destructuring", () => {
  const ast = parse("const value = 1; const { ...rest } = process.env;", { sourceType: "module" });
  const aliases = new Set();
  const variables = new Set();
  for (const statement of ast.program.body) collectEnvironmentBindings(statement.declarations[0], aliases, variables);
  expect(aliases).toEqual(new Set());
  expect(variables).toEqual(new Set());
});

test("ignores computed destructuring keys without static names", () => {
  const ast = parse("const { [field]: value } = process.env;", { sourceType: "module" });
  const aliases = new Set();
  const variables = new Set();
  collectEnvironmentBindings(ast.program.body[0].declarations[0], aliases, variables);
  expect(variables).toEqual(new Set());
});

test("ignores non-declaration AST nodes", () => {
  const aliases = new Set();
  const variables = new Set();
  collectEnvironmentBindings(null, aliases, variables);
  collectEnvironmentBindings("not an AST node", aliases, variables);
  expect(aliases).toEqual(new Set());
  expect(variables).toEqual(new Set());
});
