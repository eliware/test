import { expect, test } from "@jest/globals";
import {
  findTestContractViolations,
  validateTestContract,
} from "../../../../src/checks/general/E-0.1/find-test-contract-violations.mjs";

test("requires an executable Jest declaration and its matching source import", () => {
  expect(
    findTestContractViolations(
      ["good.mjs"],
      new Map([
        ["good.test.mjs", 'import subject from "../src/good.mjs"; test("works", () => subject);'],
      ]),
    ),
  ).toEqual([]);
  expect(
    findTestContractViolations(
      ["no-test.mjs"],
      new Map([["no-test.test.mjs", 'import "../src/no-test.mjs";']]),
    ),
  ).toEqual(["tests/no-test.test.mjs does not declare an executable Jest test"]);
  expect(
    findTestContractViolations(
      ["no-import.mjs"],
      new Map([["no-import.test.mjs", 'test("works", () => {});']]),
    ),
  ).toEqual([
    "tests/no-import.test.mjs does not import its matching source module (src/no-import.mjs)",
  ]);
});

test("does not count declarations or imports that occur only in comments or strings", () => {
  const content = `
    // import "../src/trap.mjs"; test("comment", () => {});
    const example = 'import "../src/trap.mjs"; test("string", () => {})';
  `;
  expect(findTestContractViolations(["trap.mjs"], new Map([["trap.test.mjs", content]]))).toEqual([
    "tests/trap.test.mjs does not declare an executable Jest test",
    "tests/trap.test.mjs does not import its matching source module (src/trap.mjs)",
  ]);
});

test("rejects unrelated imports even when a Jest test declaration exists", () => {
  expect(
    findTestContractViolations(
      ["target.mjs"],
      new Map([["target.test.mjs", 'import "../src/other.mjs"; test("works", () => {});']]),
    ),
  ).toEqual(["tests/target.test.mjs does not import its matching source module (src/target.mjs)"]);
});

test("accepts Jest aliases, parameterized tests, dynamic imports, and module mocks", () => {
  expect(
    validateTestContract(
      "nested/module.mjs",
      "tests/nested/module.test.mjs",
      `
        import { it as check } from "@jest/globals";
        jest.unstable_mockModule("../../src/nested/module.mjs", () => ({}));
        check.each([1, 2])("loads %s", async () => import("../../src/nested/module.mjs"));
      `,
    ),
  ).toEqual([]);
});

test("accepts exported source references and executable Jest modifiers", () => {
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      'export * from "../src/module.mjs"; test.concurrent.only("works", function () {});',
    ),
  ).toEqual([]);
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      'import "../src/module.mjs"; test.skip("skipped", () => {});',
    ),
  ).toEqual(["tests/module.test.mjs does not declare an executable Jest test"]);
});

test("accepts re-exports, require references, Jest API aliases, and static templates", () => {
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      `
        import { jest as testApi } from "@jest/globals";
        export { default } from "../src/module.mjs";
        testApi.mock(\`../src/module.mjs\`, () => ({}));
        test("works", () => require("../src/module.mjs"));
      `,
    ),
  ).toEqual([]);
});

test("rejects non-executable Jest declarations and computed unrelated test APIs", () => {
  for (const declaration of [
    'test("missing callback");',
    'test("string callback", "not a callback");',
    'test.skip.each([1])("skipped", () => {});',
    'test.todo("unfinished");',
    'other.test.only("unrelated", () => {});',
    'getRunner().test("unrelated", () => {});',
    'new Runner()("not Jest", () => {});',
    "test.each([1]);",
  ]) {
    expect(
      validateTestContract(
        "module.mjs",
        "tests/module.test.mjs",
        `import "../src/module.mjs"; ${declaration}`,
      ),
    ).toEqual(["tests/module.test.mjs does not declare an executable Jest test"]);
  }
});

test("supports static dynamic import templates and rejects interpolated paths", () => {
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      'test("works", async () => import(`../src/module.mjs`));',
    ),
  ).toEqual([]);
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      'test("works", async () => import(`../src/${name}.mjs`));',
    ),
  ).toEqual(["tests/module.test.mjs does not import its matching source module (src/module.mjs)"]);
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      'test("works", async () => import(name));',
    ),
  ).toEqual(["tests/module.test.mjs does not import its matching source module (src/module.mjs)"]);
});

test("accepts computed modifiers, aliased Jest tests, and optional parameterized calls", () => {
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      `
        import { test as check } from "@jest/globals";
        check?.("optional test", () => {});
        check["only"]("selected", () => {});
        check.each?.([1])("optional %s", () => {});
        import("../src/module.mjs");
      `,
    ),
  ).toEqual([]);
});

test("ignores test-shaped calls that are not Jest test functions", () => {
  expect(
    validateTestContract(
      "module.mjs",
      "tests/module.test.mjs",
      'import "../src/module.mjs"; createRunner()("not Jest", () => {});',
    ),
  ).toEqual(["tests/module.test.mjs does not declare an executable Jest test"]);
});

test("reports invalid JavaScript rather than accepting text that resembles a test", () => {
  expect(
    validateTestContract("bad.mjs", "tests/bad.test.mjs", 'test("unfinished", () => {'),
  ).toEqual([expect.stringContaining("tests/bad.test.mjs could not be parsed as JavaScript:")]);
});

test("reports both contract violations when a mirrored test is missing", () => {
  expect(findTestContractViolations(["missing.mjs"], new Map())).toEqual([
    "tests/missing.test.mjs does not declare an executable Jest test",
    "tests/missing.test.mjs does not import its matching source module (src/missing.mjs)",
  ]);
});
