import { expect, test } from "@jest/globals";
import { validateTestToolReferences } from "../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references.mjs";

test("formats prohibited references as rule diagnostics", () => {
  expect(validateTestToolReferences("src/run.mjs", 'import("vitest");')).toBe(
    "src/run.mjs must not import or invoke a test runner or coverage tool.",
  );
  expect(
    validateTestToolReferences("tests/run.test.mjs", 'import { test } from "@jest/globals";'),
  ).toBeNull();
});
