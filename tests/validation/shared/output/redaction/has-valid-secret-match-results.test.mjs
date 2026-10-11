import { expect, test } from "@jest/globals";
import { hasValidSecretMatchResults } from "../../../../../src/validation/shared/output/redaction/has-valid-secret-match-results.mjs";

test("accepts valid work and intervals inside the pending window", () => {
  expect(hasValidSecretMatchResults({ work: 2, matches: [{ start: 3, end: 6 }] }, 2, 7)).toBe(true);
});

test.each([
  [null, 0, 5],
  [{ work: Number.NaN, matches: [] }, 0, 5],
  [{ work: -1, matches: [] }, 0, 5],
  [{ work: 1, matches: null }, 0, 5],
  ...[
    { start: -1, end: 2 },
    { start: 1.5, end: 3 },
    { start: 2, end: 2 },
    { start: 2, end: 7 },
    null,
  ].map((interval) => [{ work: 1, matches: [interval] }, 0, 6]),
])("rejects malformed matcher output", (found, start, end) => {
  expect(hasValidSecretMatchResults(found, start, end)).toBe(false);
});
