import { expect, test } from "@jest/globals";
import { hasUnconditionalPublishStep } from "../../../../src/checks/npm-published/E-0.1.140/has-unconditional-publish-step.mjs";

test("accepts a publish step without conditions or continue-on-error", () => {
  expect(hasUnconditionalPublishStep({ run: "npm publish" })).toBe(true);
});

test("rejects conditional or failure-tolerant publish steps", () => {
  expect(hasUnconditionalPublishStep({ run: "npm publish", if: "always()" })).toBe(false);
  expect(hasUnconditionalPublishStep({ run: "npm publish", "continue-on-error": true })).toBe(false);
  expect(hasUnconditionalPublishStep({ run: "npm publish", continueOnError: "true" })).toBe(false);
  expect(hasUnconditionalPublishStep({ run: "npm publish", continueOnError: "false" })).toBe(true);
});
