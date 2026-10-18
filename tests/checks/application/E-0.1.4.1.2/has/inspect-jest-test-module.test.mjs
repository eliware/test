import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { inspectJestTestModule } from "../../../../../src/checks/application/E-0.1.4.1.2/has/inspect-jest-test-module.mjs";

function inspect(source) {
  return inspectJestTestModule(parse(source, { sourceType: "module" }).program).hasExecutableTest;
}

test.each([
  ['test("direct", () => {});', true],
  ['it.each([1])("table", (value) => value);', true],
  ['function verify() {} test("named", verify);', true],
  ['describe("suite", () => { test("nested", () => {}); });', true],
  ['function unused() { test("fake", () => {}); }', false],
  ['const test = (name, callback) => callback(); test("fake", () => {});', false],
  ['describe.skip("suite", () => { test("skipped", () => {}); });', false],
  ['describe.only("suite", () => { test("active", () => {}); });', true],
  ['test.skip("skipped", () => {});', false],
  ["test.each([1]);", false],
])("inspects registered Jest callbacks in %s", (source, expected) => {
  expect(inspect(source)).toBe(expected);
});

test("recognizes active imported Jest aliases", () => {
  expect(inspect('import { test as check } from "@jest/globals"; check("alias", () => {});')).toBe(
    true,
  );
  expect(
    inspect(
      'import { describe } from "other"; describe("fake", () => { test("fake", () => {}); });',
    ),
  ).toBe(false);
});
