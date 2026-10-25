import { expect, test } from "@jest/globals";
import { redactCredentialPatterns } from "../../../../../../src/validation/shared/output/redaction/redact/patterns.mjs";

test("redacts credential fields, HTTP credentials, and known token formats", () => {
  const output = redactCredentialPatterns(
    'password="secret" Authorization: Bearer abcdefghijkl ghp_1234567890abcdefghijklmnop',
  );

  expect(output).toBe("password=[REDACTED] Authorization: Bearer [REDACTED] [REDACTED]");
});

test("skips pattern scans for text shorter than every supported token", () => {
  expect(redactCredentialPatterns("abc")).toBe("abc");
});
