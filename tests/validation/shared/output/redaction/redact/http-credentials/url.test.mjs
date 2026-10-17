import { expect, test } from "@jest/globals";
import { redactUrlCredentials } from "../../../../../../../src/validation/shared/output/redaction/redact/http-credentials/url.mjs";

test("redacts credential query values and URL user information", () => {
  expect(redactUrlCredentials("https://user:pass@example.test/?token=secret&apiKey=private")).toBe(
    "https://[REDACTED]@example.test/?token=[REDACTED]&apiKey=[REDACTED]",
  );
});

test("redacts user information before IPv6 hosts and extra at signs", () => {
  expect(redactUrlCredentials("https://user:secret@[2001:db8::1]:8443/path")).toBe(
    "https://[REDACTED]@[2001:db8::1]:8443/path",
  );
  expect(redactUrlCredentials("https://user:p@ss@example.test/path")).toBe(
    "https://[REDACTED]@example.test/path",
  );
});

test("redacts URL user information before query and fragment delimiters", () => {
  expect(redactUrlCredentials("https://user:secret@example.test?token=query#section")).toBe(
    "https://[REDACTED]@example.test?token=[REDACTED]#section",
  );
});
