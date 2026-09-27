import { parse } from "@babel/parser";
import { expect, test } from "@jest/globals";
import { collectKnitSourceImportBindings } from "../../../../../src/checks/general/E-0.1/E-0.1.10/collect-knit-source-import-bindings.mjs";

test("collects side-effect module namespaces and imported operations", () => {
  const program = parse(
    'import fs from "node:fs"; import { rm as remove } from "node:fs/promises"; import x from "safe-package";',
    { sourceType: "module" },
  ).program;
  const { namespaces, importedOperations } = collectKnitSourceImportBindings(program);
  expect(namespaces).toEqual(new Set(["fs"]));
  expect(importedOperations).toEqual(new Set(["remove"]));
});

test("returns empty bindings when there are no relevant imports", () => {
  const program = parse('import x from "safe-package";', { sourceType: "module" }).program;
  expect(collectKnitSourceImportBindings(program)).toEqual({
    namespaces: new Set(),
    importedOperations: new Set(),
  });
});
