import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/harness/test-write-policy/collect/mocked-modules/is-module-mocked-for-load.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
