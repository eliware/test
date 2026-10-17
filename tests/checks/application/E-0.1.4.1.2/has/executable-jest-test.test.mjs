import { expect, test } from "@jest/globals";
import { inspectJestTestModule } from "../../../../../src/checks/application/E-0.1.4.1.2/has/executable-jest-test.mjs";

test("accepts direct and table-driven Jest callbacks", () => {
  expect(inspectJestTestModule('test("direct", () => {});')).toMatchObject({
    hasExecutableTest: true,
  });
  expect(inspectJestTestModule('it.each([1])("table", (value) => value);')).toMatchObject({
    hasExecutableTest: true,
  });
});

test("accepts named Jest callback functions", () => {
  const source = 'function verify() {} test("named", verify);';
  expect(inspectJestTestModule(source).hasExecutableTest).toBe(true);
  const variable = 'const verify = () => {}; test("named", verify);';
  expect(inspectJestTestModule(variable).hasExecutableTest).toBe(true);
  const nested = 'describe("suite", () => { function verify() {} test("named", verify); });';
  expect(inspectJestTestModule(nested).hasExecutableTest).toBe(true);
});

test("accepts active modifiers and imported test aliases", () => {
  for (const content of [
    'test.only("focused", () => {});',
    'it.concurrent("parallel", () => {});',
    'test.each([1]).only("row", () => {});',
    'import { test as caseTest } from "@jest/globals"; caseTest("alias", () => {});',
    'import * as jestApi from "@jest/globals"; jestApi.test("namespace", () => {});',
    'const check = test; check("global alias", () => {});',
    'const { test: check } = globalThis; check("destructured global alias", () => {});',
    'const { "test": check } = globalThis; check("quoted global alias", () => {});',
    'const focused = test.each([1]); focused("table alias", () => {});',
    'import * as jestApi from "@jest/globals"; const check = jestApi.test; check("import alias", () => {});',
    'globalThis.test("global property", () => {});',
    'const { test: run } = await import("@jest/globals"); run("dynamic alias", () => {});',
    'const api = await import("@jest/globals"); api.test("dynamic namespace", () => {});',
  ])
    expect(inspectJestTestModule(content).hasExecutableTest).toBe(true);
});

test("ignores Jest calls inside functions that are never invoked", () => {
  const source = 'function unused() { test("fake", () => {}); }';
  expect(inspectJestTestModule(source).hasExecutableTest).toBe(false);
});

test("rejects a test call shadowed by a module binding", () => {
  const source = 'const test = (name, callback) => callback(); test("fake", () => {});';
  expect(inspectJestTestModule(source).hasExecutableTest).toBe(false);
  const declaration = 'function test(name, callback) { callback(); } test("fake", () => {});';
  expect(inspectJestTestModule(declaration).hasExecutableTest).toBe(false);
});

test("ignores tests inside skipped Jest suites", () => {
  const source = 'describe.skip("suite", () => { test("skipped", () => {}); });';
  expect(inspectJestTestModule(source).hasExecutableTest).toBe(false);
  const focused = 'describe.only("suite", () => { test("active", () => {}); });';
  expect(inspectJestTestModule(focused).hasExecutableTest).toBe(true);
});

test("ignores non-test imports and inactive modifiers", () => {
  for (const content of [
    'import { describe } from "@jest/globals"; describe("suite", () => {});',
    'import { describe } from "other"; describe("fake", () => { test("fake", () => {}); });',
    'describe("suite", () => { function describe(name, callback) { callback(); } describe("fake", () => { test("fake", () => {}); }); });',
    'test.skip("skipped", () => {});',
    'test["skip"]("computed", () => {});',
    '(1)("not a test", () => {});',
  ])
    expect(inspectJestTestModule(content).hasExecutableTest).toBe(false);
});

test("rejects comments, strings, and table declarations without callbacks", () => {
  for (const content of [
    '// test("comment", () => {});',
    'const text = "test(\\\"string\\\", () => {})";',
    "test.each([1]);",
  ])
    expect(inspectJestTestModule(content).hasExecutableTest).toBe(false);
  expect(
    inspectJestTestModule('const suite = 1; describe("suite", suite);').hasExecutableTest,
  ).toBe(false);
});

test("rejects invalid JavaScript", () => {
  expect(inspectJestTestModule("test(;")).toEqual({
    hasExecutableTest: false,
  });
});
