import { expect, test } from "@jest/globals";
import { redactCredentialAssignments } from "../../../../../../../src/validation/shared/output/redaction/redact/credential-fields/assignments.mjs";

test("redacts key-value, quoted, and whitespace-delimited credentials", () => {
  expect(redactCredentialAssignments('apiKey="secret value" refreshToken:token-value')).toBe(
    "apiKey=[REDACTED] refreshToken:[REDACTED]",
  );
  expect(redactCredentialAssignments("password 'secret value'")).toBe("password [REDACTED]");
  expect(redactCredentialAssignments('"token" "secret-value"')).toBe('"token" [REDACTED]');
  expect(redactCredentialAssignments("  token secret-value")).toBe("  token [REDACTED]");
  expect(redactCredentialAssignments("application log: token leaked-value")).toBe(
    "application log: token [REDACTED]",
  );
});

test("redacts sensitive key names and multiline values", () => {
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
    expect(redactCredentialAssignments(`${key}=private-value`)).toBe(`${key}=[REDACTED]`);
  expect(redactCredentialAssignments('token="first line\nsecond line"')).toBe("token=[REDACTED]");
  expect(redactCredentialAssignments("password 'first line\nsecond line'")).toBe(
    "password [REDACTED]",
  );
});

test("preserves prose, coverage paths, and package names", () => {
  const prose = "redacts a secret ending exactly at the emitted boundary";
  expect(redactCredentialAssignments(prose)).toBe(prose);
  expect(redactCredentialAssignments("secret\n  ✓ handles overlapping entries")).toBe(
    "secret\n  ✓ handles overlapping entries",
  );
  expect(redactCredentialAssignments("src/app/routes/token | 100 | 90")).toBe(
    "src/app/routes/token | 100 | 90",
  );
  const manifest = JSON.stringify([
    { name: "@eliware/discord-webhook", files: [{ path: "package.json" }] },
  ]);
  expect(redactCredentialAssignments(manifest)).toBe(manifest);
});
