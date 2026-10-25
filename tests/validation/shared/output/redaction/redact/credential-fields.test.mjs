import { expect, test } from "@jest/globals";
import { redactCredentialFields } from "../../../../../../src/validation/shared/output/redaction/redact/credential-fields.mjs";

test("composes credential-field and PEM redaction while preserving ordinary text", () => {
  expect(
    redactCredentialFields(
      'apiKey="secret value"\n-----BEGIN RSA PRIVATE KEY-----\nprivate\n-----END RSA PRIVATE KEY-----',
    ),
  ).toBe("apiKey=[REDACTED]\n[REDACTED PRIVATE KEY]");
  expect(redactCredentialFields("ordinary output")).toBe("ordinary output");
});
