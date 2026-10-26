import { expect, test } from "@jest/globals";
import { resolvePendingLimit } from "../../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/bounds/pending-limit.mjs";

test("limits pending text by output size, configured length, and longest secret", () => {
  expect(resolvePendingLimit(20, 100_000, 6)).toBe(20);
  expect(resolvePendingLimit(100, 4.9, 8)).toBe(8);
  expect(resolvePendingLimit(0, 0, 0)).toBe(1);
});
