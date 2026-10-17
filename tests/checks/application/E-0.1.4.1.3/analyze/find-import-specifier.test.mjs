import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectStaticStrings } from "../../../../../src/checks/application/E-0.1.4.1.3/analyze/collect/static-strings.mjs";
import { findImportSpecifier } from "../../../../../src/checks/application/E-0.1.4.1.3/analyze/find-import-specifier.mjs";

test("reads module specifiers from import and export declarations", () => {
  const { program } = parse('import "jest"; export * from "vitest";', { sourceType: "module" });
  expect(findImportSpecifier(program.body[0], new Map())).toBe("jest");
  expect(findImportSpecifier(program.body[1], new Map())).toBe("vitest");
});

test("reads dynamic import specifiers through known names", () => {
  const { program } = parse('const runner = "jest"; import(runner);', { sourceType: "module" });
  const strings = collectStaticStrings(program);
  const dynamicImport = program.body[1].expression;
  expect(findImportSpecifier(dynamicImport, strings)).toBe("jest");
  expect(findImportSpecifier(program.body[0], strings)).toBeNull();
});
