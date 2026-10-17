import { expect, test } from "@jest/globals";
import { validateInventoryScope } from "../../../../../src/validation/shared/repository/validate/inventory-scope.mjs";

test("normalizes repository-relative scopes", () => {
  expect(validateInventoryScope("./src\\checks\\")).toBe("src/checks");
  expect(validateInventoryScope("")).toBe("");
});

test.each(["..", "../outside", "C:/outside"])("rejects an external scope: %s", (scope) => {
  expect(() => validateInventoryScope(scope)).toThrow("inside the repository");
});
