import { expect, test } from "@jest/globals";
import { normalizeRedactedStreamSecretBounds } from "../../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/policy-normalization/secret-bounds.mjs";

test("normalizes secret values and resolves their bounds", () => {
  expect(
    normalizeRedactedStreamSecretBounds(["token", "token-suffix", "token", ""], 32, 12, 12),
  ).toEqual({
    values: ["token-suffix", "token"],
    maximumSecretLength: 12,
    bounds: { outputLimit: 32, workLimit: 12, pendingLimit: 12 },
  });
});

test("uses default work and pending limits", () => {
  expect(normalizeRedactedStreamSecretBounds(["secret"], 10).bounds).toEqual({
    outputLimit: 10,
    workLimit: 1_000_000,
    pendingLimit: 10,
  });
});
