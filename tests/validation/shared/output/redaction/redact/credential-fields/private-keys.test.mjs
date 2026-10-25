import { expect, test } from "@jest/globals";
import { redactPrivateKeys } from "../../../../../../../src/validation/shared/output/redaction/redact/credential-fields/private-keys.mjs";

test.each([
  ["RSA PRIVATE KEY", "secret", "[REDACTED PRIVATE KEY]"],
  ["ENCRYPTED PRIVATE KEY", "ciphertext", "[REDACTED PRIVATE KEY]"],
  ["PUBLIC KEY", "public-data", "[REDACTED PUBLIC KEY]"],
])("redacts a %s PEM block", (type, content, expected) => {
  const pem = `-----BEGIN ${type}-----\n${content}\n-----END ${type}-----`;
  expect(redactPrivateKeys(pem)).toBe(expected);
});

test("keeps text that has no PEM key block", () => {
  expect(redactPrivateKeys("ordinary output")).toBe("ordinary output");
});
