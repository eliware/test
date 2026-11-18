import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/harness/test-write-policy/scan/source/find-test-write-policy-violations-in-ast.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
