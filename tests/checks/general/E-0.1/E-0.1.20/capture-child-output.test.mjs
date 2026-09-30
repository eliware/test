import { expect, test } from "@jest/globals";
import { createChildOutputCapture } from "../../../../../src/checks/general/E-0.1/E-0.1.20/capture-child-output.mjs";

test("captures and streams redacted bounded output", () => {
  const output = [];
  const capture = createChildOutputCapture(5, {
    onStdout: (text) => output.push(text),
  });
  capture.stdout("abcdef");
  capture.stderr("ghijkl");
  expect(capture.result()).toEqual({ stdout: "abcd…", stderr: "" });
  expect(output).toEqual(["abcde"]);
});

test("applies stderr transformation before capture", () => {
  const capture = createChildOutputCapture(20, {
    captureStderr: (text) => text.replace("hidden", ""),
  });
  capture.stderr("hiddenvisible");
  expect(capture.result()).toEqual({ stdout: "", stderr: "visible" });
});

test("supports omitted output callbacks", () => {
  const capture = createChildOutputCapture(10);
  capture.stdout("visible");
  expect(capture.result()).toEqual({ stdout: "visible", stderr: "" });
});

test("enforces a shared output budget across stdout and stderr", () => {
  const capture = createChildOutputCapture(10);
  capture.stdout("1234567");
  capture.stderr("abcdefghijk");
  const result = capture.result();
  expect(result.stdout.length + result.stderr.length).toBe(10);
  expect(result.stderr).toContain("…");
});

test("marks output as truncated when a later chunk crosses an exactly filled budget", () => {
  const capture = createChildOutputCapture(10);
  capture.stdout("1234567890");
  capture.stderr("more output");

  expect(capture.result()).toEqual({ stdout: "123456789…", stderr: "" });
});

test("handles output overflow when the configured budget is zero", () => {
  const capture = createChildOutputCapture(0);
  capture.stdout("output");
  capture.flush();

  expect(capture.result()).toEqual({ stdout: "", stderr: "" });
});

test("redacts credentials split between child output chunks", () => {
  const streamed = [];
  const capture = createChildOutputCapture(100, {
    env: { SERVICE_TOKEN: "opaque-value-123" },
    onStderr: (text) => streamed.push(text),
  });
  expect(capture.redactComplete("opaque-value-123")).toBe("[REDACTED]");
  capture.stderr("diagnostic opaque-value-");
  capture.stdout("ordinary output");
  capture.stderr("123 tail");
  capture.flush();
  expect(capture.result()).toEqual({
    stdout: "ordinary output",
    stderr: "diagnostic [REDACTED] tail",
  });
  expect(streamed.join("")).not.toContain("opaque-value-123");
});

test("suppresses complete progress output when a configured secret exceeds the capture limit", () => {
  const capture = createChildOutputCapture(4, { env: { SERVICE_TOKEN: "secret-value" } });
  expect(capture.redactComplete("secret-value")).toBe("");
});
