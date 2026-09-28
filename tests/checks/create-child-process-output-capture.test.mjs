import { expect, test } from "@jest/globals";
import { createChildProcessOutputCapture } from "../../src/checks/create-child-process-output-capture.mjs";

test("captures both streams and redacts diagnostics using the effective environment", () => {
  const capture = createChildProcessOutputCapture(
    { env: { SERVICE_TOKEN: "capture-secret-value" } },
    ["explicit-secret-value"],
    100,
  );
  capture.push("stdout", "out capture-secret-value");
  capture.push("stderr", "err explicit-secret-value");
  capture.push("unknown", "ignored");
  expect(capture.redactDiagnostic("failed capture-secret-value")).toBe("failed [REDACTED]");
  expect(capture.finish()).toEqual({
    stdout: "out [REDACTED]",
    stderr: "err [REDACTED]",
  });
});

test("uses inherited environment by default and accepts binary chunks", () => {
  const capture = createChildProcessOutputCapture({ env: {} }, undefined, 4);
  capture.push("stdout", Buffer.from("okay"));
  capture.push("stderr", Buffer.from("later"));
  expect(capture.finish()).toEqual({ stdout: "okay", stderr: "" });
});

test("ignores later chunks without encoding after the capture budget is exhausted", () => {
  let encoded = false;
  const capture = createChildProcessOutputCapture({ env: {} }, [], 1);
  capture.push("stdout", "x");
  capture.push("stderr", {
    toString() {
      encoded = true;
      return "oversized";
    },
  });

  expect(encoded).toBe(false);
  expect(capture.finish()).toEqual({ stdout: "x", stderr: "" });
});

test("uses the process environment when no child environment is provided", () => {
  expect(createChildProcessOutputCapture({ env: null }, [], 0).finish()).toEqual({
    stdout: "",
    stderr: "",
  });
});
