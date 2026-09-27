import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { hasFunctionScopedRequire } from "../../../../../src/checks/general/E-0.1/E-0.1.20/has-function-scoped-require.mjs";

test("finds hoisted var bindings inside nested blocks", () => {
  const ast = parse("function load() { if (true) { var require = mock; } }", {
    sourceType: "module",
  });
  expect(hasFunctionScopedRequire(ast.program.body[0].body)).toBe(true);
});

test("does not count bindings declared inside a nested function", () => {
  const ast = parse("function outer() { function inner() { var require = mock; } }", {
    sourceType: "module",
  });
  expect(hasFunctionScopedRequire(ast.program.body[0].body)).toBe(false);
});

test("ignores non-var declarations and traverses destructuring patterns", () => {
  const ast = parse("{ let require; } { var { nested: require } = value; }", {
    sourceType: "module",
  });
  expect(hasFunctionScopedRequire(ast.program)).toBe(true);
  expect(hasFunctionScopedRequire({ type: "Program", body: [] })).toBe(false);
});
