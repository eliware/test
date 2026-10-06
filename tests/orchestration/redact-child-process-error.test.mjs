import { expect, test } from "@jest/globals";
import { redactChildProcessError } from "../../src/orchestration/redact-child-process-error.mjs";

const output = {
  redactDiagnostic: (value) => String(value).replaceAll("private-value", "[REDACTED]"),
};

test("redacts standard spawn error fields and omits custom properties", () => {
  const error = new Error("failed with private-value");
  error.name = "private-value";
  error.code = "private-value";
  error.cause = new Error("private-value");
  error.token = "private-value";
  const safeError = redactChildProcessError(error, output, { stdout: "out", stderr: "err" });

  expect(safeError).toMatchObject({
    name: "[REDACTED]",
    message: "failed with [REDACTED]",
    code: "[REDACTED]",
    stdout: "out",
    stderr: "err",
  });
  expect(safeError).not.toHaveProperty("cause");
  expect(safeError).not.toHaveProperty("token");
  expect(safeError.stack).not.toContain("private-value");
});

test("normalizes non-Error values and copies only string error codes", () => {
  expect(redactChildProcessError("adapter failed", output, { stdout: "", stderr: "" })).toEqual(
    expect.objectContaining({ name: "Error", message: "adapter failed" }),
  );
  const error = new Error("failed");
  error.name = 42;
  error.code = 42;
  const safeError = redactChildProcessError(error, output, { stdout: "", stderr: "" });
  expect(safeError.name).toBe("Error");
  expect(safeError).not.toHaveProperty("code");
});
