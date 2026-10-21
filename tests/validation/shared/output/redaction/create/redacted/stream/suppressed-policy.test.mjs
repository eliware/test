import { expect, test } from "@jest/globals";
import { createSuppressedPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/suppressed-policy.mjs";

test("builds a bounded policy that suppresses output", () => {
  expect(createSuppressedPolicy(null, 0, 25, 50)).toEqual({
    outputLimit: 0,
    workLimit: 25,
    pendingLimit: 1,
    values: [],
    trimSuffix: null,
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  });
  expect(createSuppressedPolicy(null, 40, 25, 12).pendingLimit).toBe(12);
  expect(createSuppressedPolicy(["secret"], 40, 25, 12)).toBeNull();
});
