import { expect, test } from "@jest/globals";
import { redactCredentialHeaders } from "../../../../../../../src/validation/shared/output/redaction/redact/http-credentials/headers.mjs";

test("redacts credential headers and cookies", () => {
  expect(
    redactCredentialHeaders(
      "x-auth-token: header\nx-api-key: key\nx-access-token: access\nCookie: session=x\nSet-Cookie: auth=y",
    ),
  ).toBe(
    "x-auth-token: [REDACTED]\nx-api-key: [REDACTED]\nx-access-token: [REDACTED]\nCookie: [REDACTED]\nSet-Cookie: [REDACTED]",
  );
});

test("leaves unrelated headers unchanged", () => {
  expect(redactCredentialHeaders("Content-Type: application/json")).toBe(
    "Content-Type: application/json",
  );
});
