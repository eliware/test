import { expect, test } from "@jest/globals";
import { findTestToolReferencesInText } from "../../../../../src/checks/application/E-0.1.4.1.3/validate/find-test-tool-references-in-text.mjs";

test("detects command invocations and ignores inert references", () => {
  expect(findTestToolReferencesInText("vitest run")).toBe(true);
  expect(findTestToolReferencesInText("npm exec vitest run")).toBe(true);
  expect(findTestToolReferencesInText('"@jest/core"')).toBe(false);
  expect(findTestToolReferencesInText("runner: vitest")).toBe(false);
  expect(findTestToolReferencesInText("echo vitest run")).toBe(false);
  expect(findTestToolReferencesInText("# vitest run")).toBe(false);
  expect(findTestToolReferencesInText("Use the runner configuration file.")).toBe(false);
});

test("allows the supported harness instrumentation and rejects other runners", () => {
  expect(findTestToolReferencesInText("jest --runInBand", true)).toBe(false);
  expect(findTestToolReferencesInText('"@jest/core"', true)).toBe(false);
  expect(findTestToolReferencesInText("vitest run", true)).toBe(true);
});
