import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/harness/test-write-policy/collect/file-handles/collect-mocked-handles.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
