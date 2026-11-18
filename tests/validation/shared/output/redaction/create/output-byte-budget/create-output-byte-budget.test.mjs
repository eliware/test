import { expect, test } from "@jest/globals";
import method from "../../../../../../../src/validation/shared/output/redaction/create/output-byte-budget/create-output-byte-budget.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
