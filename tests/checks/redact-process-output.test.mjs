import { expect, test } from "@jest/globals";
import {
  collectRedactionSecrets,
  redactProcessOutput,
} from "../../src/checks/redact-process-output.mjs";

test("redacts configured sensitive environment values literally", () => {
  expect(collectRedactionSecrets()).toEqual([]);
  const secrets = collectRedactionSecrets({ SAFE: "visible", SERVICE_TOKEN: "opaque-value-123" });
  expect(redactProcessOutput("child leaked opaque-value-123", secrets)).toBe(
    "child leaked [REDACTED]",
  );
  expect(secrets).toEqual(["opaque-value-123"]);
  expect(redactProcessOutput("unchanged", [null, ""])).toBe("unchanged");
});

test("redacts short configured values and secrets after the first hundred entries", () => {
  const environment = Object.fromEntries(
    Array.from({ length: 105 }, (_, index) => [`SERVICE_TOKEN_${index}`, `secret-${index}`]),
  );
  environment.SHORT_TOKEN = "x";
  const secrets = collectRedactionSecrets(environment);
  expect(secrets).toHaveLength(106);
  expect(redactProcessOutput("last secret-104 and x", secrets)).toBe(
    "last [REDACTED] and [REDACTED]",
  );
});

test("redacts structured, quoted, and authorization credentials", () => {
  expect(redactProcessOutput('password: "secret value" token=abc12345')).toBe(
    "password: [REDACTED] token=[REDACTED]",
  );
  expect(redactProcessOutput("Authorization: Bearer abcdefghijkl")).toBe(
    "Authorization: Bearer [REDACTED]",
  );
  expect(redactProcessOutput('API_KEY "quoted secret" user:pass@https://example.test')).toBe(
    "API_KEY [REDACTED] user:pass@https://example.test",
  );
  expect(redactProcessOutput("https://alice:secret@example.test/path")).toBe(
    "https://[REDACTED]@example.test/path",
  );
});

test("redacts common header, provider token, JWT, and private-key formats", () => {
  const output = redactProcessOutput(
    [
      "x-api-key: header-secret",
      "ghp_1234567890abcdefghijklmnop",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
      "-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----",
    ].join("\n"),
  );
  expect(output).not.toContain("header-secret");
  expect(output).not.toContain("ghp_");
  expect(output).not.toContain("eyJhbGci");
  expect(output).not.toContain("BEGIN PRIVATE KEY");
});

test("redacts JSON and camelCase credential keys", () => {
  expect(redactProcessOutput('{"apiKey":"json-secret","refreshToken":"refresh-secret"}')).toBe(
    '{"apiKey":[REDACTED],"refreshToken":[REDACTED]}',
  );
  const multiline = redactProcessOutput("password = 'multi\nline secret'");
  expect(multiline).toMatch(/password[\s=:]+\[REDACTED\]/iu);
  expect(multiline).not.toContain("multi");
});

test("redacts cookie and common CI credential formats", () => {
  const output = redactProcessOutput("Cookie: session=secret\nNPM_TOKEN=abc123secret");
  expect(output).not.toContain("session=secret");
  expect(output).not.toContain("abc123secret");
});

test("composes environment-value and pattern-family redaction", () => {
  expect(redactProcessOutput('password="xoxb-123456789"', ["private-value"])).toBe(
    "password=[REDACTED]",
  );
});
