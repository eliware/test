import { expect, test } from "@jest/globals";
import { validateRequiredScripts } from "../../../../../src/checks/general/E-1/E-1.20/validate-required-scripts.mjs";

const scripts = {
  test: "eliware-test",
  lint: "eliware-test --lint",
  audit: "eliware-test --audit",
  format: "eliware-test --format",
  "format:check": "eliware-test --format-check",
};

test("accepts the exact shared validation scripts", () => {
  expect(validateRequiredScripts(scripts)).toBeNull();
});

test("reports the first missing or incorrect validation script", () => {
  expect(validateRequiredScripts({ ...scripts, test: "jest" })).toBe("package.json.scripts.test must be exactly eliware-test.");
});
