import { expect, test } from "@jest/globals";
import { findDirectValidationDependencies } from "../../../../../src/checks/general/E-1/E-1.3/validate-validation-dependencies.mjs";

test("finds direct validation-tool dependencies across dependency sections", () => {
  expect(findDirectValidationDependencies({
    dependencies: { jest: "1.0.0" },
    devDependencies: { oxlint: "1.0.0", safe: "1.0.0" },
    optionalDependencies: { "@oxlint/cli": "1.0.0" },
    peerDependencies: { "@jest/globals": "1.0.0" },
  })).toEqual(["jest", "oxlint", "@oxlint/cli", "@jest/globals"]);
});

test("handles absent dependency sections and an empty package document", () => {
  expect(findDirectValidationDependencies({ devDependencies: { safe: "1.0.0" } })).toEqual([]);
  expect(findDirectValidationDependencies()).toEqual([]);
});
