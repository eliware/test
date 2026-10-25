import { expect, test } from "@jest/globals";
import { normalizeRedactedStreamPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/policy-normalization.mjs";

test("normalizes secrets and applies bounded stream limits", () => {
  const result = normalizeRedactedStreamPolicy(["token", "token-suffix", "token", ""], 32, {
    maxSearchWorkPerChunk: 2_000_000,
    maxPendingLength: 100_000,
  });

  expect(result).toEqual({
    maximumSecretLength: 12,
    policy: {
      outputLimit: 32,
      workLimit: 1_000_000,
      pendingLimit: 32,
      values: ["token-suffix", "token"],
    },
  });
});

test("clamps minimum limits and replaces non-finite bounds", () => {
  const minimum = normalizeRedactedStreamPolicy([], 10, {
    maxSearchWorkPerChunk: 0,
    maxPendingLength: 0,
  });
  const nonFinite = normalizeRedactedStreamPolicy(["secret"], Number.POSITIVE_INFINITY, {
    maxSearchWorkPerChunk: Number.NaN,
  });

  expect(minimum.policy).toMatchObject({ outputLimit: 10, workLimit: 1, pendingLimit: 1 });
  expect(nonFinite.policy).toMatchObject({ outputLimit: 100_000, workLimit: 1_000_000 });
});

test("returns a suppressed policy when secret normalization exceeds its limit", () => {
  const result = normalizeRedactedStreamPolicy(["s".repeat(166_667)], 200_000);

  expect(result).toMatchObject({
    maximumSecretLength: 0,
    policy: {
      outputLimit: 200_000,
      values: [],
      trimSuffix: null,
      findSecretEnds: null,
      findSafeBoundary: null,
      suppressed: true,
    },
  });
});
