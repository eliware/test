import { expect, test } from "@jest/globals";
import { createFormatterDiagnostic } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-formatter-diagnostic.mjs";

test("redacts and combines formatter diagnostic messages", () => {
  expect(
    createFormatterDiagnostic(
      "Prettier failed",
      ["failed formatter-secret-value", "also formatter-secret-value"],
      { API_TOKEN: "formatter-secret-value" },
    ),
  ).toBe("Prettier failed: failed [REDACTED]\nalso [REDACTED]");
});

test("reports a clear message when formatter diagnostics are empty", () => {
  expect(createFormatterDiagnostic("Prettier failed", ["", "\n"])).toBe(
    "Prettier failed without diagnostics.",
  );
});

test("bounds formatter diagnostics to the configured byte budget", () => {
  const diagnostic = createFormatterDiagnostic("Prettier failed", ["x".repeat(150_000)]);
  expect(diagnostic.length).toBeLessThanOrEqual(100_000 + "Prettier failed: ".length);
  expect(diagnostic).toContain("Prettier failed: ");
});
