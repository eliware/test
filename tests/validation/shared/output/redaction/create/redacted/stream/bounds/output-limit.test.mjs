import { expect, test } from "@jest/globals";
import { resolveOutputLimit } from "../../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/bounds/output-limit.mjs";

test("uses the default output limit for non-finite values", () => {
  expect(resolveOutputLimit(Number.NaN)).toBe(100_000);
  expect(resolveOutputLimit(Number.POSITIVE_INFINITY)).toBe(100_000);
});

test("floors and clamps finite output limits", () => {
  expect(resolveOutputLimit(4.9)).toBe(4);
  expect(resolveOutputLimit(-1)).toBe(0);
  expect(resolveOutputLimit(2_000_000)).toBe(1_000_000);
});
