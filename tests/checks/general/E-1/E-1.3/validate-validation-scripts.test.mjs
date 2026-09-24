import { expect, test } from "@jest/globals";
import { findInvalidValidationScripts } from "../../../../../src/checks/general/E-1/E-1.3/validate-validation-scripts.mjs";

test("finds package scripts invoking validation tools directly", () => {
  expect(findInvalidValidationScripts({
    test: "jest",
    lint: "npx --yes oxlint src",
    format: "prettier --write .",
    safe: "eliware-test --lint",
    invalidValue: null,
  })).toEqual(["test", "lint", "format"]);
  expect(findInvalidValidationScripts()).toEqual([]);
});
