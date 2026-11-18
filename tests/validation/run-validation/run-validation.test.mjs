import { expect, test } from "@jest/globals";
import method from "../../../src/validation/run-validation/run-validation.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
