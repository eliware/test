import { expect, test } from "@jest/globals";
import { inspectJestTestModule } from "../../../../src/checks/application/E-0.1.4.1.2/has-executable-jest-test.mjs";

test("accepts direct and table-driven Jest callbacks", () => {
  expect(
    inspectJestTestModule('test("direct", () => {});', "tests/a.test.mjs", "src/a.mjs"),
  ).toMatchObject({ hasExecutableTest: true, importsSource: false });
  expect(
    inspectJestTestModule(
      'it.each([1])("table", (value) => value);',
      "tests/a.test.mjs",
      "src/a.mjs",
    ),
  ).toMatchObject({ hasExecutableTest: true });
});

test("accepts named Jest callback functions", () => {
  const source = 'function verify() {} test("named", verify);';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    true,
  );
  const variable = 'const verify = () => {}; test("named", verify);';
  expect(inspectJestTestModule(variable, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    true,
  );
  const nested = 'describe("suite", () => { function verify() {} test("named", verify); });';
  expect(inspectJestTestModule(nested, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    true,
  );
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
    'import * as jestApi from "@jest/globals"; const check = jestApi.test; check("import alias", () => {});',
    'globalThis.test("global property", () => {});',
    'const { test: run } = await import("@jest/globals"); run("dynamic alias", () => {});',
    'const api = await import("@jest/globals"); api.test("dynamic namespace", () => {});',
  ])
    expect(inspectJestTestModule(content, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
      true,
    );
});

test("rejects callbacks shadowed by non-function parameters", () => {
  const source = 'function callback() {} function unused(callback) { test("shadowed", callback); }';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("rejects a Jest function alias after reassignment", () => {
  const source = 'let run = test; run = () => {}; run("not a test", () => {});';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("ignores non-test imports and inactive modifiers", () => {
  for (const content of [
    'import { describe } from "@jest/globals"; describe("suite", () => {});',
    'test.skip("skipped", () => {});',
    'test["skip"]("computed", () => {});',
    '(1)("not a test", () => {});',
  ])
    expect(inspectJestTestModule(content, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
      false,
    );
});

test("rejects comments, strings, and table declarations without callbacks", () => {
  for (const content of [
    '// test("comment", () => {});',
    'const text = "test(\\\"string\\\", () => {})";',
    "test.each([1]);",
  ])
    expect(inspectJestTestModule(content, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
      false,
    );
});

test("rejects invalid JavaScript", () => {
  expect(inspectJestTestModule("test(;", "tests/a.test.mjs", "src/a.mjs")).toEqual({
    hasExecutableTest: false,
    importsSource: false,
  });
});

test("recognizes exact static, dynamic, and re-exported source references", () => {
  for (const content of [
    'import { value } from "../src/a.mjs";',
    'export { value } from "../src/a.mjs";',
    'await import("../src/a.mjs");',
  ])
    expect(inspectJestTestModule(content, "tests/a.test.mjs", "src/a.mjs").importsSource).toBe(
      true,
    );
  expect(
    inspectJestTestModule(
      '// import { value } from "../src/a.mjs";',
      "tests/a.test.mjs",
      "src/a.mjs",
    ).importsSource,
  ).toBe(false);
});
