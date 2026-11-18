import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/shared/repository/validate/documentation-traversal-limits/validate-documentation-traversal-limits.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
