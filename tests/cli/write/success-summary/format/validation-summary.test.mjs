import { expect, test } from "@jest/globals";
import formatValidationSummary from "../../../../../src/cli/write/success-summary/format/validation-summary.mjs";

test("formats shared validation summary details", () => {
  expect(formatValidationSummary("Validation passed.", {}, 1000)).toContain("Checks: 0");
});
