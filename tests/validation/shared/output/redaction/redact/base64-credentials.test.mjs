import { expect, test } from "@jest/globals";
import { redactGenericBase64Credentials } from "../../../../../../src/validation/shared/output/redaction/redact/base64-credentials.mjs";

test("redacts generic Base64 credentials", () => {
  expect(redactGenericBase64Credentials("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef2")).toBe("[REDACTED]");
  expect(redactGenericBase64Credentials("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef")).toBe("[REDACTED]");
});

test("preserves hexadecimal strings, slash values, low-entropy text, and paths", () => {
  const hexadecimal = `${"a".repeat(31)}2`;
  const path = "tests/validation/stages/jest/progress/create/jest/console-output-log.mjs";

  expect(redactGenericBase64Credentials(hexadecimal)).toBe(hexadecimal);
  expect(redactGenericBase64Credentials("ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefgh")).toBe(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefgh",
  );
  expect(redactGenericBase64Credentials("x".repeat(64))).toBe("x".repeat(64));
  expect(redactGenericBase64Credentials(path)).toBe(path);
  expect(redactGenericBase64Credentials("ordinary output")).toBe("ordinary output");
});
