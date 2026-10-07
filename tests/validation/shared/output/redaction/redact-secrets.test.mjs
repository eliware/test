import { expect, test } from "@jest/globals";
import { redactMatchedSecrets } from "../../../../../src/validation/shared/output/redaction/redact-secrets.mjs";

test("redacts overlapping and separate secret ranges", () => {
  expect(redactMatchedSecrets("abcde and xy", [5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 12, 12, 0])).toBe(
    "[REDACTED] and [REDACTED]",
  );
  expect(redactMatchedSecrets("ordinary", [])).toBe("ordinary");
  expect(redactMatchedSecrets("abcdef", [0, 0, 6], 4)).toBe("abcd");
});
