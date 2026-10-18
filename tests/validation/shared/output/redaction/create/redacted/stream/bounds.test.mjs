import { expect, test } from "@jest/globals";
import { resolveRedactedStreamBounds } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/bounds.mjs";

test("clamps output, work, and pending limits", () => {
  expect(resolveRedactedStreamBounds(20, 2_000_000, 100_000, 6)).toEqual({
    outputLimit: 20,
    workLimit: 1_000_000,
    pendingLimit: 20,
  });
  expect(resolveRedactedStreamBounds(-1, 0, 0, 0)).toEqual({
    outputLimit: 0,
    workLimit: 1,
    pendingLimit: 1,
  });
});

test("uses defaults for non-finite values and retains long secrets", () => {
  expect(resolveRedactedStreamBounds(Infinity, NaN, 16, 65_000)).toEqual({
    outputLimit: 100_000,
    workLimit: 1_000_000,
    pendingLimit: 65_000,
  });
});
