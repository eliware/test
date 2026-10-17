import { expect, test } from "@jest/globals";
import { redactKnownTokenFormats } from "../../../../../../src/validation/shared/output/redaction/redact/known-token-formats.mjs";

test("redacts CI credential assignments and common provider tokens", () => {
  const output = redactKnownTokenFormats(
    "NPM_TOKEN=abc GH_TOKEN=def ghp_1234567890abcdefghijklmnop github_pat_abc npm_123456789012345678901234567890 pypi-private sk-secret xoxb-value AIza12345678901234567890 AKIA1234567890ABCDEF",
  );
  expect(output).not.toMatch(
    /abc|def|ghp_|github_pat|npm_123|pypi-private|sk-secret|xoxb|AIza|AKIA/u,
  );
  expect(redactKnownTokenFormats("npm_execpath")).toBe("npm_execpath");
});

test("redacts SSH keys and JWTs and preserves ordinary hashes", () => {
  expect(redactKnownTokenFormats("ssh-ed25519 AAAAB3NzaC1yc2E= key")).not.toContain("AAAAB");
  expect(redactKnownTokenFormats("ecdsa-sha2-nistp256 AAAAB3NzaC1yc2E= key")).toBe("[REDACTED]");
  expect(redactKnownTokenFormats(`${"a".repeat(31)}2`)).toBe(`${"a".repeat(31)}2`);
  expect(redactKnownTokenFormats("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef2")).toBe("[REDACTED]");
  expect(redactKnownTokenFormats("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef")).toBe("[REDACTED]");
  expect(redactKnownTokenFormats("ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefgh")).toBe(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefgh",
  );
  expect(redactKnownTokenFormats("x".repeat(64))).toBe("x".repeat(64));
  const path = "tests/validation/stages/jest/progress/create/jest/console-output-log.mjs";
  expect(redactKnownTokenFormats(path)).toBe(path);
  expect(redactKnownTokenFormats("eyJhbGci.eyJzdWIi.signature")).toBe("[REDACTED]");
  expect(redactKnownTokenFormats("ordinary output")).toBe("ordinary output");
});
