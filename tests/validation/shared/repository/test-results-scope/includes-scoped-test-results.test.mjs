import { expect, test } from "@jest/globals";
import method from "../../../../../src/validation/shared/repository/test-results-scope/includes-scoped-test-results.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
