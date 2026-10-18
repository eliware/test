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

test("redacts SSH keys and JWTs", () => {
  expect(redactKnownTokenFormats("ssh-ed25519 AAAAB3NzaC1yc2E= key")).not.toContain("AAAAB");
  expect(redactKnownTokenFormats("ecdsa-sha2-nistp256 AAAAB3NzaC1yc2E= key")).toBe("[REDACTED]");
  expect(redactKnownTokenFormats("eyJhbGci.eyJzdWIi.signature")).toBe("[REDACTED]");
});

test("preserves ordinary output", () => {
  expect(redactKnownTokenFormats("ordinary output")).toBe("ordinary output");
});
