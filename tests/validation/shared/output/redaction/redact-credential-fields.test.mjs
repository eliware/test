import { expect, test } from "@jest/globals";
import { redactCredentialFields } from "../../../../../src/validation/shared/output/redaction/redact-credential-fields.mjs";

test("redacts key-value, quoted, whitespace-delimited, and private-key credentials", () => {
  expect(redactCredentialFields('apiKey="secret value" refreshToken:token-value')).toBe(
    "apiKey=[REDACTED] refreshToken:[REDACTED]",
  );
  expect(redactCredentialFields("password 'secret value'")).toBe("password [REDACTED]");
  expect(
    redactCredentialFields(
      "-----BEGIN RSA PRIVATE KEY-----\nsecret\n-----END RSA PRIVATE KEY-----",
    ),
  ).toBe("[REDACTED PRIVATE KEY]");
  expect(
    redactCredentialFields(
      "-----BEGIN ENCRYPTED PRIVATE KEY-----\nciphertext\n-----END ENCRYPTED PRIVATE KEY-----",
    ),
  ).toBe("[REDACTED PRIVATE KEY]");
  expect(redactCredentialFields("ordinary output")).toBe("ordinary output");
});

test("does not treat a following line as a whitespace-delimited credential value", () => {
  expect(redactCredentialFields("secret\n  ✓ handles overlapping entries")).toBe(
    "secret\n  ✓ handles overlapping entries",
  );
});

test("preserves coverage rows whose paths contain credential-like words", () => {
  expect(redactCredentialFields("src/app/routes/token | 100 | 90")).toBe(
    "src/app/routes/token | 100 | 90",
  );
});
