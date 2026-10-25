import { expect, test } from "@jest/globals";
import { createSuppressedPolicy } from "../../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/policy-normalization/suppressed-policy.mjs";

test("returns no suppressed policy for normalized secrets", () => {
  expect(createSuppressedPolicy(["secret"], 10, 20, 30)).toBeNull();
});

test("builds a bounded suppressed policy when normalization fails", () => {
  expect(createSuppressedPolicy(null, 0, 20, 30)).toEqual({
    outputLimit: 0,
    workLimit: 20,
    pendingLimit: 1,
    values: [],
    trimSuffix: null,
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  });
  expect(createSuppressedPolicy(null, 40, 25, 12).pendingLimit).toBe(12);
});
