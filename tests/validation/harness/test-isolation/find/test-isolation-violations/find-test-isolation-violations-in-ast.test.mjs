import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/harness/test-isolation/find/test-isolation-violations/find-test-isolation-violations-in-ast.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
