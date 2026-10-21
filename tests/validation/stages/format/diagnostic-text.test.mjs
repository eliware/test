import { expect, test } from "@jest/globals";
import { createFormatterDiagnosticText } from "../../../../src/validation/stages/format/diagnostic-text.mjs";

test("redacts and joins formatter messages", () => {
  expect(
    createFormatterDiagnosticText(
      ["failed formatter-secret-value", "", "also formatter-secret-value"],
      { API_TOKEN: "formatter-secret-value" },
    ),
  ).toBe("failed [REDACTED]\nalso [REDACTED]");
});

test("returns empty text when all formatter messages are empty", () => {
  expect(createFormatterDiagnosticText(["", ""])).toBe("");
});
