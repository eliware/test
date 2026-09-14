import { expect, test } from "@jest/globals";
import { readDiagnosticOptions } from "../../src/cli/read-diagnostic-options.mjs";

test("maps supported diagnostic flags to current rule IDs and preserves Jest arguments", () => {
  expect(readDiagnosticOptions(["--ignore-100x4", "tests/example.test.mjs"])).toEqual({
    ignoredRuleIds: ["E-1.20.10"],
    mode: null,
    jestArgs: ["--ignore-100x4", "tests/example.test.mjs"],
  });
  expect(readDiagnosticOptions(["--ignore-monolith-limits"]).ignoredRuleIds).toEqual(["E-1.20.16"]);
  expect(readDiagnosticOptions(["--lint"]).mode).toBe("lint");
  expect(() => readDiagnosticOptions(["--lint", "--audit"])).toThrow(/mutually exclusive/);
});

test("rejects unsupported command-line flags before validation", () => {
  expect(() => readDiagnosticOptions(["--runInBand"])).toThrow(/Unsupported validation argument/);
});

test("rejects conflicting informational commands", () => {
  expect(() => readDiagnosticOptions(["--help", "--version"])).toThrow(
    "--help and --version cannot be used together",
  );
});
