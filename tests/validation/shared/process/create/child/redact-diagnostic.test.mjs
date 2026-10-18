import { expect, jest, test } from "@jest/globals";
import { redactChildProcessDiagnostic } from "../../../../../../src/validation/shared/process/create/child/redact-diagnostic.mjs";

test("redacts complete diagnostics before returning them", () => {
  const redactor = {
    redactComplete: jest.fn((text) => text.replace("secret-value", "[REDACTED]")),
  };

  expect(redactChildProcessDiagnostic("failed secret-value", redactor, 100)).toBe(
    "failed [REDACTED]",
  );
  expect(redactor.redactComplete).toHaveBeenCalledWith("failed secret-value");
});

test("keeps diagnostic truncation at complete redaction markers and UTF-8 boundaries", () => {
  const redactor = {
    redactComplete: (text) => text.replace("secret-value", "[REDACTED]"),
  };

  expect(redactChildProcessDiagnostic("secret-value", redactor, 14)).toBe("[REDACTED]");
  const truncated = redactChildProcessDiagnostic("éé secret-value", redactor, 14);
  expect(Buffer.byteLength(truncated)).toBeLessThanOrEqual(14);
  expect(truncated).toBe("éé ");
});
