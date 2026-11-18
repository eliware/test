import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/harness/test-write-policy/collect/mocked-modules/get-restricted-module-name.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
