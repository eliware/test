import { expect, test } from "@jest/globals";
import { readDiagnosticOptions } from "../../src/cli/read-diagnostic-options.mjs";

test("maps supported diagnostic flags to current rule IDs and preserves Jest arguments", () => {
  expect(readDiagnosticOptions(["--ignore-100x4", "tests/example.test.mjs"])).toEqual({
    ignoredRuleIds: ["E-1.20.10"],
    mode: null,
    toolArgs: ["tests/example.test.mjs"],
    jestArgs: ["--ignore-100x4", "tests/example.test.mjs"],
  });
  expect(readDiagnosticOptions(["--ignore-monolith-limits"]).ignoredRuleIds).toEqual(["E-1.20.16"]);
  expect(readDiagnosticOptions(["--lint"]).mode).toBe("lint");
  expect(readDiagnosticOptions(["--audit", "--omit=dev"]).toolArgs).toEqual(["--omit=dev"]);
  expect(() => readDiagnosticOptions(["--lint", "--audit"])).toThrow(/mutually exclusive/);
});

test("forwards non-wrapper Jest options unchanged", () => {
  expect(readDiagnosticOptions(["--runInBand"]).jestArgs).toEqual(["--runInBand"]);
});

test("rejects conflicting informational commands", () => {
  expect(() => readDiagnosticOptions(["--help", "--version"])).toThrow(
    "--help and --version cannot be used together",
  );
});

test("rejects multiple focused paths", () => {
  expect(() => readDiagnosticOptions(["tests/a.test.mjs", "tests/b.test.mjs"])).toThrow(
    "Only one focused test path",
  );
});

test("rejects unsupported focused path roots", () => {
  expect(() => readDiagnosticOptions(["src/example.mjs"])).toThrow("must be under tests/");
});

test("does not treat option values as focused paths and preserves them for Jest", () => {
  expect(readDiagnosticOptions([
    "--testNamePattern", "tests/looks-like-a-path.test.mjs", "tests/example.test.mjs",
  ])).toMatchObject({
    jestArgs: ["--testNamePattern", "tests/looks-like-a-path.test.mjs", "tests/example.test.mjs"],
  });
});

test("accepts focused specs paths using the shared grammar", () => {
  expect(readDiagnosticOptions(["specs/example.spec.mjs"]).jestArgs).toEqual(["specs/example.spec.mjs"]);
});

test("recognizes values for common Jest options", () => {
  expect(readDiagnosticOptions([
    "--moduleNameMapper", "tests/looks-like-a-path.test.mjs", "tests/example.test.mjs",
  ])).toMatchObject({
    jestArgs: ["--moduleNameMapper", "tests/looks-like-a-path.test.mjs", "tests/example.test.mjs"],
  });
});

test("rejects non-string arguments", () => {
  expect(() => readDiagnosticOptions([null])).toThrow("Unsupported validation argument");
});

test("rejects informational commands combined with validation", () => {
  expect(() => readDiagnosticOptions(["--help", "--lint"])).toThrow(
    "Informational commands cannot be combined",
  );
});
