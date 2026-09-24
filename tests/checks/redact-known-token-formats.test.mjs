import { expect, test } from "@jest/globals";
import { redactKnownTokenFormats } from "../../src/checks/redact-known-token-formats.mjs";

test("redacts CI credential assignments and common provider tokens", () => {
  const output = redactKnownTokenFormats("NPM_TOKEN=abc GH_TOKEN=def ghp_1234567890abcdefghijklmnop github_pat_abc npm_xyz pypi-private sk-secret xoxb-value AIza12345678901234567890 AKIA1234567890ABCDEF");
  expect(output).not.toMatch(/abc|def|ghp_|github_pat|npm_xyz|pypi-private|sk-secret|xoxb|AIza|AKIA/u);
});

test("redacts SSH keys, opaque token strings, JWTs, and leaves ordinary text", () => {
  expect(redactKnownTokenFormats("ssh-ed25519 AAAAB3NzaC1yc2E= key")).not.toContain("AAAAB");
  expect(redactKnownTokenFormats(`${"a".repeat(31)}2`)).toBe("[REDACTED]");
  expect(redactKnownTokenFormats("eyJhbGci.eyJzdWIi.signature")).toBe("[REDACTED]");
  expect(redactKnownTokenFormats("ordinary output")).toBe("ordinary output");
});
