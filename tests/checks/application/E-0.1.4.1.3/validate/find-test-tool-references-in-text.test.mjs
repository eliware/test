import { expect, test } from "@jest/globals";
import { findTestToolReferencesInText } from "../../../../../src/checks/application/E-0.1.4.1.3/validate/find-test-tool-references-in-text.mjs";

test("detects test-tool references and commands in plain text", () => {
  expect(findTestToolReferencesInText('"@jest/core"')).toBe(true);
  expect(findTestToolReferencesInText("Run npm exec vitest run.")).toBe(true);
  expect(findTestToolReferencesInText('"@jest/globals"')).toBe(false);
  expect(findTestToolReferencesInText("Use the runner configuration file.")).toBe(false);
});

test("allows the supported harness instrumentation and rejects other runners", () => {
  expect(findTestToolReferencesInText('"istanbul-lib-instrument"', true)).toBe(false);
  expect(findTestToolReferencesInText('"@jest/core"', true)).toBe(false);
  expect(findTestToolReferencesInText('"@vitest/runner"', true)).toBe(true);
  expect(findTestToolReferencesInText("Run vitest run.", true)).toBe(true);
});
