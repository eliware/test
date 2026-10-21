import { expect, test } from "@jest/globals";
import { createFormatterDiagnostic } from "../../../../src/validation/stages/format/create-formatter-diagnostic.mjs";

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
