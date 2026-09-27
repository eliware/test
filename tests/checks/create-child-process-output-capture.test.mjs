import { expect, test } from "@jest/globals";
import { createChildProcessOutputCapture } from "../../src/checks/create-child-process-output-capture.mjs";

test("handles inherited and configured values", () => {
  const previous = process.env.ELIWARE_TEST_CAPTURE_TOKEN;
  process.env.ELIWARE_TEST_CAPTURE_TOKEN = "inherited-secret";
  try {
    const inherited = createChildProcessOutputCapture({}, [], 100);
    inherited.push("stdout", "output inherited-secret");
    expect(inherited.finish()).toEqual({ stdout: "output [REDACTED]", stderr: "" });
  } finally {
    if (previous === undefined) delete process.env.ELIWARE_TEST_CAPTURE_TOKEN;
    else process.env.ELIWARE_TEST_CAPTURE_TOKEN = previous;
  }
  const capture = createChildProcessOutputCapture({
    env: { SERVICE_TOKEN: "configured-secret", ODD_NAME: "explicit-secret" },
  }, ["explicit-secret"], 100);
  capture.push("stdout", "output configured-secret explicit-secret");
  expect(capture.finish()).toEqual({ stdout: "output [REDACTED] [REDACTED]", stderr: "" });

});

test("bounds captured data across streams", () => {
  const capture = createChildProcessOutputCapture({}, [], 12);
  capture.push("stdout", "output");
  capture.push("stderr", "warning");
  const result = capture.finish();
  expect(result.stdout.length + result.stderr.length).toBeLessThanOrEqual(12);
});

test("bounds captured UTF-8 output by bytes without splitting a code point", () => {
  const capture = createChildProcessOutputCapture({ env: {} }, [], 5);
  capture.push("stdout", "ééé");
  const result = capture.finish();
  expect(result.stdout).toBe("éé");
  expect(Buffer.byteLength(result.stdout)).toBe(4);
});

test("applies the limit after redaction and retains safe text after a long secret", () => {
  const secret = "sensitive-token";
  const capture = createChildProcessOutputCapture({ env: {} }, [secret], 20);
  capture.push("stdout", `safe${secret}tail!!`);
  expect(capture.finish()).toEqual({ stdout: "safe[REDACTED]tail!!", stderr: "" });
});

test("does not expose truncated text", () => {
  const secret = "credential-boundary";
  const capture = createChildProcessOutputCapture({}, [secret], 20);
  capture.push("stdout", "o".repeat(15));
  capture.push("stderr", Buffer.from(secret));
  const result = capture.finish();
  expect(result.stdout + result.stderr).not.toContain(secret.slice(0, 5));
});

test("ignores invalid lists and later chunks", () => {
  const capture = createChildProcessOutputCapture({ env: {} }, "ignored", 4);
  capture.push("unknown", "ignored");
  capture.push("stdout", "ordinary");
  capture.push("stderr", "later");
  expect(capture.finish()).toEqual({ stdout: "ordi", stderr: "" });

  const shortened = createChildProcessOutputCapture({ env: {} }, ["x"], 12);
  shortened.push("stdout", "x".repeat(12));
  shortened.push("stderr", "after the raw limit");
  const shortenedResult = shortened.finish();
  expect(shortenedResult.stdout.startsWith("[REDACTED]")).toBe(true);
  expect(shortenedResult.stderr).toBe("af");
  expect(shortenedResult.stdout.length).toBeLessThanOrEqual(12);
});
