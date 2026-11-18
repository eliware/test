import { expect, test } from "@jest/globals";
import method from "../../../../../../../src/validation/shared/output/redaction/create/safe-reporter-output/create-safe-reporter-output.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
