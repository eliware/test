import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectAssignedJestSuiteNames } from "../../../../../src/checks/application/E-0.1.4.1.2/collect/assigned-jest-suite-names.mjs";

test("finds assignments to suite names in nested AST nodes", () => {
  const program = parse('describe("suite", () => { describe = custom; });', {
    sourceType: "module",
  }).program;
  expect(collectAssignedJestSuiteNames(program, new Set(["describe"]))).toEqual(
    new Set(["describe"]),
  );
});

test("ignores absent or non-AST nodes", () => {
  expect(collectAssignedJestSuiteNames(null, new Set(["describe"]))).toEqual(new Set());
  expect(collectAssignedJestSuiteNames({ nested: [null] }, new Set(["describe"]))).toEqual(
    new Set(),
  );
});
