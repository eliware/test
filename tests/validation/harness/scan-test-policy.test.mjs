import { expect, test } from "@jest/globals";
import { findTestPolicyViolations } from "../../../src/validation/harness/scan-test-policy.mjs";

test("reports malformed source with its path", () => {
  expect(findTestPolicyViolations("const = ;", "tests/broken.test.mjs")).toEqual([
    "tests/broken.test.mjs: could not parse the test module.",
  ]);
});
