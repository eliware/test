import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectRequireBindingScopes } from "../../../../../src/checks/general/E-0.1/E-0.1.20/collect-require-binding-scopes.mjs";

test("tracks bindings only in the lexical scope that declares require", () => {
  const ast = parse('require("alpha"); function nested(require) { require("ignored"); }', {
    sourceType: "module",
  });
  const scopes = collectRequireBindingScopes(ast);
  const program = ast.program;
  expect(scopes.has(program)).toBe(false);
  expect(scopes.has(program.body[1])).toBe(true);
});

test("recognizes a top-level var require binding in the program scope", () => {
  const ast = parse('var require = mock; require("ignored");', { sourceType: "module" });
  expect(collectRequireBindingScopes(ast).has(ast.program)).toBe(true);
});

test("resolves block and catch bindings without leaking into sibling scopes", () => {
  const ast = parse(
    '{ const require = mock; require("ignored"); } try {} catch (require) { require("ignored"); }',
    {
      sourceType: "module",
    },
  );
  const scopes = collectRequireBindingScopes(ast.program);
  expect(scopes.has(ast.program.body[0])).toBe(true);
  expect(scopes.has(ast.program.body[1].handler)).toBe(true);
  expect(scopes.has(ast.program)).toBe(false);
});

test("recognizes hoisted declarations, export declarations, and parameter patterns", () => {
  const sources = [
    "function load() { if (true) { var require = mock; } }",
    "export const require = localRequire;",
    "export default function require() {}",
    'const load = ({ nested: { require } }) => require("ignored");',
    'import "side-effect-only";',
    "function load() { try {} catch {} }",
  ];
  for (const source of sources)
    collectRequireBindingScopes(parse(source, { sourceType: "module" }));
  expect(collectRequireBindingScopes(null).has(undefined)).toBe(false);
});

test("does not mistake object property keys for bound identifiers", () => {
  const ast = parse("const load = ({ require: local }) => local;", { sourceType: "module" });
  expect(collectRequireBindingScopes(ast).has(ast.program)).toBe(false);
  expect(collectRequireBindingScopes(ast).has(ast.program.body[0].declarations[0].init)).toBe(
    false,
  );
});

test("handles empty declarations and non-binding AST nodes", () => {
  expect(collectRequireBindingScopes({ type: "Program", body: [null] }).has(undefined)).toBe(false);
  const expression = {
    type: "Program",
    body: [
      {
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            id: { type: "Identifier", name: "load" },
            init: {
              type: "FunctionExpression",
              id: { type: "Identifier", name: "named" },
              params: [],
              body: { type: "BlockStatement", body: [] },
            },
          },
        ],
      },
    ],
  };
  const scopes = collectRequireBindingScopes(expression);
  expect(scopes.has(expression)).toBe(false);
  expect(scopes.has(expression.body[0].declarations[0].init)).toBe(false);
  const namedFunction = parse("const load = function named() {};", { sourceType: "module" });
  expect(
    collectRequireBindingScopes(namedFunction).has(
      namedFunction.program.body[0].declarations[0].init,
    ),
  ).toBe(false);
  expression.body.push({
    type: "FunctionDeclaration",
    params: [{ type: "PrivateName" }],
    body: { type: "BlockStatement", body: [] },
  });
  expect(collectRequireBindingScopes(expression).has(expression.body[1])).toBe(false);
});

test("handles imports, all binding pattern forms, and a nested var declaration", () => {
  const cases = [
    ['import { value as require } from "dependency";', (program) => program],
    ["function load(...require) {}", (program) => program.body[0]],
    ["function load(require = fallback) {}", (program) => program.body[0]],
    ["const load = ([require]) => require;", (program) => program.body[0].declarations[0].init],
    [
      "const load = ({ ...require }) => require;",
      (program) => program.body[0].declarations[0].init,
    ],
  ];
  for (const [source, target] of cases) {
    const ast = parse(source, { sourceType: "module" });
    expect(collectRequireBindingScopes(ast).has(target(ast.program))).toBe(true);
  }
  const noBinding = parse('import { require as local } from "dependency";', {
    sourceType: "module",
  });
  expect(collectRequireBindingScopes(noBinding).has(noBinding.program)).toBe(false);
  const nestedVar = parse("function load() { if (true) { var require = local; } }", {
    sourceType: "module",
  });
  expect(collectRequireBindingScopes(nestedVar).has(nestedVar.program.body[0])).toBe(true);
});

test("does not recurse indefinitely through cyclic AST-like objects", () => {
  const ast = { type: "Program", body: [] };
  ast.self = ast;
  expect(collectRequireBindingScopes(ast).has(ast)).toBe(false);
});

test("traverses deeply nested AST nodes without exhausting the call stack", () => {
  const ast = { type: "Program", body: [] };
  let current = ast;
  for (let index = 0; index < 20_000; index += 1) {
    current.child = { type: "Expression" };
    current = current.child;
  }
  expect(collectRequireBindingScopes(ast).has(ast)).toBe(false);
});

test("tracks lexical require bindings declared in for-loop headers", () => {
  for (const source of [
    'for (const require = local; ready; next()) require("ignored");',
    'for (let require in loaders) require("ignored");',
    'for (let require of loaders) require("ignored");',
    'for (const { require } of loaders) require("ignored");',
  ]) {
    const loop = parse(source, { sourceType: "module" }).program.body[0];
    expect(collectRequireBindingScopes(loop).has(loop)).toBe(true);
  }
  for (const source of [
    "for (;;) {}",
    "for (const value in loaders) {}",
    "for (const value of loaders) {}",
    'for (var require = local; ready; next()) require("ignored");',
  ]) {
    const loop = parse(source, { sourceType: "module" }).program.body[0];
    expect(collectRequireBindingScopes(loop).has(loop)).toBe(false);
  }
});
