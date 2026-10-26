import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectImportedJestTestBindings } from "../../../../../../src/checks/application/E-0.1.4.1.2/collect/jest/import-bindings.mjs";

test("collects named and namespace Jest test imports", () => {
  const names = { callbacks: new Set(["test", "it"]), namespaces: new Set() };
  const program = parse(
    'import { test as check, it } from "@jest/globals"; import * as jestApi from "@jest/globals";',
    { sourceType: "module" },
  ).program;

  collectImportedJestTestBindings(program, names);

  expect(names.callbacks).toEqual(new Set(["test", "it", "check"]));
  expect(names.namespaces).toEqual(new Set(["jestApi"]));
});

test("ignores imports that do not bind test functions", () => {
  const names = { callbacks: new Set(["test", "it"]), namespaces: new Set() };
  const program = parse('import { describe } from "@jest/globals";', {
    sourceType: "module",
  }).program;

  collectImportedJestTestBindings(program, names);

  expect(names).toEqual({ callbacks: new Set(["test", "it"]), namespaces: new Set() });
});
