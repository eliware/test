import { expect, test } from "@jest/globals";
import { findTestContractViolations } from "../../../../src/checks/general/E-1/find-test-contract-violations.mjs";

test("requires a Jest declaration and an implementation import for every source", () => {
  expect(findTestContractViolations(["good.mjs"], new Map([["good.test.mjs", 'import x from "../src/good.mjs"; test("works", () => x);']]))).toEqual([]);
  expect(findTestContractViolations(["no-test.mjs"], new Map([["no-test.test.mjs", 'import x from "../src/no-test.mjs";']]))).toEqual(["no-test.test.mjs is not a Jest test file"]);
  expect(findTestContractViolations(["no-import.mjs"], new Map([["no-import.test.mjs", 'test("works", () => {});']]))).toEqual(["no-import.test.mjs does not reference an implementation module"]);
});

test("reports both contract violations when a mirrored test is missing", () => {
  expect(findTestContractViolations(["missing.mjs"], new Map())).toEqual([
    "missing.test.mjs is not a Jest test file",
    "missing.test.mjs does not reference an implementation module",
  ]);
});
