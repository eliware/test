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
    'const focused = test.each([1]); focused("table alias", () => {});',
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

test("ignores Jest calls inside functions that are never invoked", () => {
  const source = 'function unused() { test("fake", () => {}); }';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("rejects a test call shadowed by a module binding", () => {
  const source = 'const test = (name, callback) => callback(); test("fake", () => {});';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
  const declaration = 'function test(name, callback) { callback(); } test("fake", () => {});';
  expect(
    inspectJestTestModule(declaration, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest,
  ).toBe(false);
});

test("rejects a destructured Jest alias from a shadowed globalThis binding", () => {
  const source = 'const globalThis = {}; const { test: run } = globalThis; run("fake", () => {});';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("rejects a Jest name shadowed by a top-level block var", () => {
  const source = '{ var test = custom; } test("fake", () => {});';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("rejects a test call that uses a block-scoped fake Jest binding", () => {
  const source = '{ let test = (name, callback) => callback(); test("fake", () => {}); }';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("keeps a real Jest call outside a block-local shadow", () => {
  const source =
    'import { test } from "@jest/globals"; { let test = custom; } test("real", () => {});';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    true,
  );
});

test("keeps a real Jest call outside a nested function declaration shadow", () => {
  const source =
    'import { test } from "@jest/globals"; describe("suite", () => { { function test() {} } test("real", () => {}); });';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    true,
  );
});

test("rejects a Jest call shadowed by a block-local function declaration", () => {
  const source =
    'import { test } from "@jest/globals"; { function test() {} test("fake", () => {}); }';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("rejects fake suites that shadow the Jest describe function", () => {
  const source =
    'function describe(name, callback) { callback(); } describe("fake", () => { test("fake", () => {}); });';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("rejects suites that reassign the imported Jest describe function", () => {
  const source =
    'import { describe, test } from "@jest/globals"; describe = custom; describe("fake", () => { test("fake", () => {}); });';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
});

test("ignores tests inside skipped Jest suites", () => {
  const source = 'describe.skip("suite", () => { test("skipped", () => {}); });';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
  const focused = 'describe.only("suite", () => { test("active", () => {}); });';
  expect(inspectJestTestModule(focused, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    true,
  );
});

// codescope ignore this because alias validation rejects assignments in every control-flow branch.
test("rejects a Jest function alias after reassignment", () => {
  const source = 'let run = test; run = () => {}; run("not a test", () => {});';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").hasExecutableTest).toBe(
    false,
  );
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
  expect(
    inspectJestTestModule(
      'const suite = 1; describe("suite", suite);',
      "tests/a.test.mjs",
      "src/a.mjs",
    ).hasExecutableTest,
  ).toBe(false);
});

test("rejects invalid JavaScript", () => {
  expect(inspectJestTestModule("test(;", "tests/a.test.mjs", "src/a.mjs")).toEqual({
    hasExecutableTest: false,
    importsSource: false,
  });
});

test("includes a re-exported source module", () => {
  const source = 'export { value } from "../src/a.mjs";';
  expect(inspectJestTestModule(source, "tests/a.test.mjs", "src/a.mjs").importsSource).toBe(true);
});
