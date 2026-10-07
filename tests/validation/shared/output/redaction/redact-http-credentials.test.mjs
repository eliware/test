import { expect, test } from "@jest/globals";
import { redactHttpCredentials } from "../../../../../src/validation/shared/output/redaction/redact-http-credentials.mjs";

test("redacts authorization, proxy, and bare bearer or basic values", () => {
  const output = redactHttpCredentials(
    "Authorization: Basic abcdefgh\nproxy-authorization: Bearer token-value\nBearer abcdefgh",
  );
  expect(output).not.toMatch(/abcdef|token-value/u);
});

test("redacts short bearer and basic credentials", () => {
  const output = redactHttpCredentials("Authorization: Bearer x\nBasic ab");
  expect(output).toBe("Authorization: Bearer [REDACTED]\nBasic [REDACTED]");
  expect(output).not.toMatch(/Bearer x|Basic ab/u);
});

test("redacts URL user-info, credential query values, sensitive headers, and cookies", () => {
  const output = redactHttpCredentials(
    "https://user:pass@example.test/?token=secret&apiKey=private\nx-auth-token: header\nCookie: session=x",
  );
  expect(output).not.toMatch(/user:pass|token=secret|apiKey=private|header|session=x/u);
  expect(redactHttpCredentials("ordinary output")).toBe("ordinary output");
});

test("redacts URL user-info when the host is an IPv6 address", () => {
  const output = redactHttpCredentials("https://user:secret@[2001:db8::1]:8443/resource");
  expect(output).toBe("https://[REDACTED]@[2001:db8::1]:8443/resource");
  expect(output).not.toContain("secret");
});

test("redacts URL user-info containing additional at signs", () => {
  const output = redactHttpCredentials("https://user:p@ss@example.test/path");
  expect(output).toBe("https://[REDACTED]@example.test/path");
  expect(output).not.toContain("p@ss");
});

test("redacts URL user-info before query and fragment delimiters", () => {
  const output = redactHttpCredentials(
    "https://user:secret@example.test?token=query#section https://user:secret@example.test#section",
  );
  expect(output).not.toContain("user:secret");
  expect(output).toContain("https://[REDACTED]@example.test?token=[REDACTED]#section");
  expect(output).toContain("https://[REDACTED]@example.test#section");
});
