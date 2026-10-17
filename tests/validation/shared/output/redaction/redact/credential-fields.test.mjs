import { expect, test } from "@jest/globals";
import { redactCredentialFields } from "../../../../../../src/validation/shared/output/redaction/redact/credential-fields.mjs";

test("redacts key-value, quoted, whitespace-delimited, and private-key credentials", () => {
  expect(redactCredentialFields('apiKey="secret value" refreshToken:token-value')).toBe(
    "apiKey=[REDACTED] refreshToken:[REDACTED]",
  );
  expect(redactCredentialFields("password 'secret value'")).toBe("password [REDACTED]");
  expect(redactCredentialFields('"token" "secret-value"')).toBe('"token" [REDACTED]');
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
  expect(
    redactCredentialFields("-----BEGIN PUBLIC KEY-----\npublic-data\n-----END PUBLIC KEY-----"),
  ).toBe("[REDACTED PUBLIC KEY]");
  expect(redactCredentialFields("ordinary output")).toBe("ordinary output");
});

test("redacts mature sensitive key names from Eliware Redact", () => {
  const keys = [
    "cookie",
    "set-cookie",
    "passphrase",
    "webhook",
    "signature",
    "tlsKey",
    "tlsCert",
    "proxyAuthorization",
  ];
  for (const key of keys)
    expect(redactCredentialFields(`${key}=private-value`)).toBe(`${key}=[REDACTED]`);
});

test("does not treat a following line as a whitespace-delimited credential value", () => {
  expect(redactCredentialFields("secret\n  ✓ handles overlapping entries")).toBe(
    "secret\n  ✓ handles overlapping entries",
  );
});

test("does not redact credential words in prose", () => {
  const text = "redacts a secret ending exactly at the emitted boundary";
  expect(redactCredentialFields(text)).toBe(text);
});

test("redacts whitespace-delimited credentials at the start of a line", () => {
  expect(redactCredentialFields("  token secret-value")).toBe("  token [REDACTED]");
  expect(redactCredentialFields("application log: token leaked-value")).toBe(
    "application log: token [REDACTED]",
  );
});

test("redacts quoted credentials that span multiple lines", () => {
  expect(redactCredentialFields('token="first line\nsecond line"')).toBe("token=[REDACTED]");
  expect(redactCredentialFields("password 'first line\nsecond line'")).toBe("password [REDACTED]");
});

test("preserves coverage rows whose paths contain credential-like words", () => {
  expect(redactCredentialFields("src/app/routes/token | 100 | 90")).toBe(
    "src/app/routes/token | 100 | 90",
  );
  expect(redactCredentialFields("src/app/routes/webhook | 100 | 90")).toBe(
    "src/app/routes/webhook | 100 | 90",
  );
});
