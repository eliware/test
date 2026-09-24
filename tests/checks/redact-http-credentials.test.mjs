import { expect, test } from "@jest/globals";
import { redactHttpCredentials } from "../../src/checks/redact-http-credentials.mjs";

test("redacts authorization, proxy, and bare bearer or basic values", () => {
  const output = redactHttpCredentials("Authorization: Basic abcdefgh\nproxy-authorization: Bearer token-value\nBearer abcdefgh");
  expect(output).not.toMatch(/abcdef|token-value/u);
});

test("redacts URL user-info, credential query values, sensitive headers, and cookies", () => {
  const output = redactHttpCredentials("https://user:pass@example.test/?token=secret&apiKey=private\nx-auth-token: header\nCookie: session=x");
  expect(output).not.toMatch(/user:pass|token=secret|apiKey=private|header|session=x/u);
  expect(redactHttpCredentials("ordinary output")).toBe("ordinary output");
});
