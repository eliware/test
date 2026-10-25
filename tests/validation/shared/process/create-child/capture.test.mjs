import { expect, test } from "@jest/globals";
import { createChildOutputCaptureBuffer } from "../../../../../src/validation/shared/process/create-child/capture.mjs";

test("captures stdout and stderr within one shared bound", () => {
  const capture = createChildOutputCaptureBuffer(10);
  capture.appendStdout("1234567");
  capture.appendStderr("abcdefghijk");

  expect(capture.result()).toEqual({ stdout: "1234567", stderr: "ab…" });
});

test("marks the last captured chunk when later output crosses an exact bound", () => {
  const capture = createChildOutputCaptureBuffer(10);
  capture.appendStdout("1234567890");
  capture.appendStderr("more output");

  expect(capture.result()).toEqual({ stdout: "123456789…", stderr: "" });
});

test("keeps Unicode code points intact and handles a zero bound", () => {
  const capture = createChildOutputCaptureBuffer(3);
  capture.appendStdout("😀tail");
  expect(capture.result().stdout).toBe("😀…");

  const empty = createChildOutputCaptureBuffer(0);
  empty.appendStdout("output");
  expect(empty.result()).toEqual({ stdout: "", stderr: "" });
});
