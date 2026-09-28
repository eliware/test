import { parse } from "@babel/parser";
import { expect, test } from "@jest/globals";
import { hasUnsupportedKnitSourceAlias } from "../../../../../src/checks/general/E-0.1/E-0.1.10/find-unsupported-knit-source-alias.mjs";

function program(source) {
  return parse(source, { sourceType: "module" }).program;
}

test("detects direct, computed, nested, and rest aliases of effectful globals", () => {
  for (const source of [
    "const p = process;",
    "const [action] = process;",
    "const { ...all } = process;",
    "const { exit: { nested } } = process;",
    'const { ["exit"]: action } = process;',
    "const { [operation]: action } = process;",
    "const { fetch: action } = globalThis;",
    "const { process: scope } = globalThis; scope.exit(1);",
    'const { [property]: scope } = globalThis; scope.fetch("https://example.test");',
    "const { require: action } = process;",
    "function nested() { const action = process; }",
  ])
    expect(hasUnsupportedKnitSourceAlias(program(source))).toBe(true);
});

test("allows safe declarations and handles cyclic syntax trees", () => {
  expect(hasUnsupportedKnitSourceAlias(program("const value = 1; const { cwd } = process;"))).toBe(
    false,
  );
  expect(hasUnsupportedKnitSourceAlias(null)).toBe(false);
  const cyclic = { type: "Program", body: [] };
  cyclic.body.push(cyclic);
  expect(hasUnsupportedKnitSourceAlias(cyclic)).toBe(false);
});

test("rejects aliases of imported namespaces and operations", () => {
  const source = program("const alias = importedBinding;");
  expect(
    hasUnsupportedKnitSourceAlias(source, {
      namespaces: new Set(["importedBinding"]),
      importedOperations: new Set(),
    }),
  ).toBe(true);
  expect(
    hasUnsupportedKnitSourceAlias(source, {
      namespaces: new Set(),
      importedOperations: new Set(["importedBinding"]),
    }),
  ).toBe(true);
});
