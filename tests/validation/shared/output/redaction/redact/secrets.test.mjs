import { expect, test } from "@jest/globals";
import { redactMatchedSecrets } from "../../../../../../src/validation/shared/output/redaction/redact/secrets.mjs";

test("redacts overlapping and separate secret ranges", () => {
  expect(redactMatchedSecrets("abcde and xy", [5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 12, 12, 0])).toBe(
    "[REDACTED] and [REDACTED]",
  );
  expect(redactMatchedSecrets("ordinary", [])).toBe("ordinary");
  expect(redactMatchedSecrets("ordinary", undefined)).toBe("ordinary");
  expect(redactMatchedSecrets("abcdef", [0, 0, 6], 4)).toBe("abcd");
});

test("checks only stored match positions in a sparse result", () => {
  const matchEnds = [];
  matchEnds.length = 1_000_000;
  matchEnds[999_990] = 1_000_000;

  expect(redactMatchedSecrets("x".repeat(1_000_000), matchEnds)).toBe(
    `${"x".repeat(999_990)}[REDACTED]`,
  );
});

test("redacts map entries without allocating an endpoint array", () => {
  const text = "x".repeat(1_000_000);
  const matches = new Map([[999_990, 1_000_000]]);

  expect(redactMatchedSecrets(text, matches)).toBe(`${"x".repeat(999_990)}[REDACTED]`);
});

test("redacts match entries without allocating an endpoint array", () => {
  const text = "x".repeat(1_000_000);
  const matches = new Map([[999_990, 1_000_000]]);

  expect(redactMatchedSecrets(text, matches)).toBe(`${"x".repeat(999_990)}[REDACTED]`);
});
