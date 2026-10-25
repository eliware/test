import { expect, test } from "@jest/globals";
import { normalizeRedactedStreamPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/policy-normalization.mjs";

test("normalizes and deduplicates secret values", () => {
  const result = normalizeRedactedStreamPolicy(["token", "token-suffix", "token", ""], 32, {
    maxSearchWorkPerChunk: 12,
    maxPendingLength: 12,
  });

  expect(result.maximumSecretLength).toBe(12);
  expect(result.policy.values).toEqual(["token-suffix", "token"]);
});

test("returns a suppressed policy when secret normalization exceeds its limit", () => {
  const result = normalizeRedactedStreamPolicy(["s".repeat(166_667)], 200_000);

  expect(result).toMatchObject({
    maximumSecretLength: 0,
    policy: {
      values: [],
      trimSuffix: null,
      findSecretEnds: null,
      findSafeBoundary: null,
      suppressed: true,
    },
  });
});
