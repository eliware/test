import { expect, jest, test } from "@jest/globals";
import { createChildProcessOutputCapture } from "../../src/orchestration/create-child-process-output-capture.mjs";
import { createSecretTextMatcher } from "../../src/orchestration/create-secret-text-matcher.mjs";

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

test("builds one immutable secret matcher for both output streams", () => {
  const makeSecretMatcher = jest.fn(createSecretTextMatcher);
  const capture = createChildProcessOutputCapture(
    { env: { SERVICE_TOKEN: "shared-secret" } },
    [],
    100,
    makeSecretMatcher,
  );
  capture.push("stdout", "stdout shared-secret");
  capture.push("stderr", "stderr shared-secret");

  expect(capture.finish()).toEqual({
    stdout: "stdout [REDACTED]",
    stderr: "stderr [REDACTED]",
  });
  expect(makeSecretMatcher).toHaveBeenCalledTimes(1);
});

test("uses inherited environment by default and accepts binary chunks", () => {
  const capture = createChildProcessOutputCapture({ env: {} }, undefined, 4);
  capture.push("stdout", Buffer.from("okay"));
  capture.push("stderr", Buffer.from("later"));
  expect(capture.finish()).toEqual({ stdout: "okay", stderr: "" });
});

test("avoids creating redaction matchers when a child produces no output", () => {
  const makeSecretMatcher = jest.fn(createSecretTextMatcher);
  const capture = createChildProcessOutputCapture({ env: {} }, [], 100, makeSecretMatcher);

  capture.push("stdout", "");
  expect(capture.finish()).toEqual({ stdout: "", stderr: "" });
  expect(makeSecretMatcher).not.toHaveBeenCalled();
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

test("retains long secrets while respecting the shared output budget", () => {
  const secret = "s".repeat(51);
  const capture = createChildProcessOutputCapture({ env: {} }, [secret], 100);
  capture.push("stdout", "x".repeat(60));
  capture.push("stderr", "y".repeat(60));
  expect(capture.finish()).toEqual({ stdout: "x".repeat(60), stderr: "y".repeat(40) });
});
