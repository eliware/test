import { expect, test } from "@jest/globals";
import { createChildOutputCapture } from "../../../../../src/checks/general/E-1/E-1.20/capture-child-output.mjs";

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
