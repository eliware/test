import { expect, test } from "@jest/globals";
import { redactCredentialFields } from "../../src/checks/redact-credential-fields.mjs";

test("redacts key-value, quoted, whitespace-delimited, and private-key credentials", () => {
  expect(redactCredentialFields('apiKey="secret value" refreshToken:token-value')).toBe('apiKey=[REDACTED] refreshToken:[REDACTED]');
  expect(redactCredentialFields("password 'secret value'" )).toBe("password [REDACTED]");
  expect(redactCredentialFields("-----BEGIN RSA PRIVATE KEY-----\nsecret\n-----END RSA PRIVATE KEY-----")).toBe("[REDACTED PRIVATE KEY]");
  expect(redactCredentialFields("ordinary output")).toBe("ordinary output");
});
