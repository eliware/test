import { expect, test } from "@jest/globals";
import { redactAuthorizationCredentials } from "../../../../../../../src/validation/shared/output/redaction/redact/http-credentials/authorization.mjs";

test("redacts authorization and proxy authorization values", () => {
  expect(
    redactAuthorizationCredentials(
      "Authorization: Basic abcdefgh\nproxy-authorization: Bearer token-value",
    ),
  ).toBe("Authorization: Basic [REDACTED]\nproxy-authorization: Bearer [REDACTED]");
});

test("redacts bare and short bearer or basic values", () => {
  expect(redactAuthorizationCredentials("Bearer abc.def:ghi~jkl\nBasic ab")).toBe(
    "Bearer [REDACTED]\nBasic [REDACTED]",
  );
});

test("redacts values that follow an already redacted authorization header", () => {
  expect(redactAuthorizationCredentials("Authorization: [REDACTED] leaked")).toBe(
    "Authorization: [REDACTED] [REDACTED]",
  );
});
