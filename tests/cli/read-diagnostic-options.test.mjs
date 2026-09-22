import { expect, test } from "@jest/globals";
import { readDiagnosticOptions } from "../../src/cli/read-diagnostic-options.mjs";

test("maps supported diagnostic flags and preserves Jest arguments", () => {
  expect(readDiagnosticOptions(["tests/example.test.mjs"])).toEqual({
    ignoredRuleIds: [],
    mode: null,
    toolArgs: ["tests/example.test.mjs"],
    jestArgs: ["tests/example.test.mjs"],
  });
  expect(() => readDiagnosticOptions(["--ignore-100x4"])).toThrow("Legacy ignore flags are no longer supported");
  expect(readDiagnosticOptions(["--lint"]).mode).toBe("lint");
  expect(readDiagnosticOptions(["--audit", "--omit=dev"]).toolArgs).toEqual(["--omit=dev"]);
  expect(() => readDiagnosticOptions(["--lint", "--audit"])).toThrow(/mutually exclusive/);
});

test("forwards non-wrapper Jest options unchanged", () => {
  expect(readDiagnosticOptions(["--runInBand"]).jestArgs).toEqual(["--runInBand"]);
});

test("preserves the delegation separator and its following arguments", () => {
  expect(readDiagnosticOptions(["--audit", "--", "--omit=dev"]).toolArgs)
    .toEqual(["--", "--omit=dev"]);
});

test("rejects conflicting informational commands", () => {
  expect(() => readDiagnosticOptions(["--help", "--version"])).toThrow(
    "--help and --version cannot be used together",
  );
});

test("rejects repeated informational commands", () => {
  expect(() => readDiagnosticOptions(["--help", "--help"])).toThrow("cannot be repeated");
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

test("rejects specs paths because focused Jest execution is rooted under tests", () => {
  expect(() => readDiagnosticOptions(["specs/example.spec.mjs"])).toThrow("Focused paths must be under tests/");
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

test("rejects focused Jest paths combined with tool modes", () => {
  expect(() => readDiagnosticOptions(["--audit", "tests/example.test.mjs"])).toThrow("cannot be combined");
});
