import { expect, test } from "@jest/globals";
import { hasProhibitedTestToolReference } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/policy.mjs";

test("applies the selected file policy and returns false for unsupported files", () => {
  expect(hasProhibitedTestToolReference("src/run.mjs", 'import("vitest");', false)).toBe(true);
  expect(hasProhibitedTestToolReference("config.txt", "vitest run", false)).toBe(false);
});
