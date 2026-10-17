import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectJestTestAliases } from "../../../../../src/checks/application/E-0.1.4.1.2/collect/jest-test-aliases.mjs";

function declaration(source) {
  return parse(source, { sourceType: "module" }).program.body[0].declarations[0];
}

function createNames() {
  return { callbacks: new Set(["test", "it"]), namespaces: new Set(), namespaceAliases: new Map() };
}

test("collects namespace aliases from Jest globals imports", () => {
  const names = createNames();

  expect(
    collectJestTestAliases(declaration('const jestApi = await import("@jest/globals");'), names),
  ).toBe(true);
  expect(names.namespaces).toContain("jestApi");
});

test("collects test aliases from Jest imports and records namespace aliases", () => {
  const importedNames = createNames();
  const namespaceNames = { ...createNames(), namespaces: new Set(["jestApi"]) };

  expect(
    collectJestTestAliases(
      declaration('const { test: run } = await import("@jest/globals");'),
      importedNames,
    ),
  ).toBe(true);
  expect(importedNames.callbacks).toContain("run");
  expect(
    collectJestTestAliases(declaration("const { it: suiteTest } = jestApi;"), namespaceNames),
  ).toBe(true);
  expect(namespaceNames.namespaceAliases.get("jestApi")).toEqual(new Set(["suiteTest"]));
});

test("collects active aliases and ignores unrelated or repeated bindings", () => {
  const names = createNames();

  expect(collectJestTestAliases(declaration("const register = test;"), names)).toBe(true);
  expect(collectJestTestAliases(declaration("const register = test;"), names)).toBe(false);
  expect(collectJestTestAliases(declaration("const value = 1;"), names)).toBe(false);
  expect(collectJestTestAliases({ type: "ExpressionStatement" }, names)).toBe(false);
});
