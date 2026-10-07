import { expect, jest, test } from "@jest/globals";
import {
  createChildProgressHandler,
  handleChildProgress,
} from "../../../../src/validation/shared/process/handle-child-progress.mjs";

test("resets the watchdog and forwards matching progress", () => {
  const resetProgressTimer = jest.fn();
  const onProgress = jest.fn();
  expect(
    handleChildProgress("progress", {
      progressPattern: /^progress$/,
      resetProgressTimer,
      onProgress,
    }),
  ).toBe(true);
  expect(resetProgressTimer).toHaveBeenCalledTimes(1);
  expect(onProgress).toHaveBeenCalledWith("progress");
});

test("ignores non-matching progress and optional callbacks", () => {
  const resetProgressTimer = jest.fn();
  expect(
    handleChildProgress("ordinary output", {
      progressPattern: /^progress$/,
      resetProgressTimer,
    }),
  ).toBe(false);
  expect(resetProgressTimer).not.toHaveBeenCalled();
  expect(handleChildProgress("anything", { resetProgressTimer })).toBe(false);
});

test("recognizes a progress marker divided across chunks once", () => {
  const resetProgressTimer = jest.fn();
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^\[eliware-test-progress\]/m,
    resetOnAnyOutput: false,
    resetProgressTimer,
    onProgress,
  });
  progress.push("[eliware-test-pro");
  expect(resetProgressTimer).not.toHaveBeenCalled();
  progress.push("gress] start\n");
  expect(resetProgressTimer).toHaveBeenCalledTimes(1);
  expect(onProgress).toHaveBeenCalledWith(expect.stringContaining("[eliware-test-progress] start"));
  progress.flush();
  expect(resetProgressTimer).toHaveBeenCalledTimes(1);

  progress.push("[eliware-test-progress] next");
  progress.push("\n");
  expect(resetProgressTimer).toHaveBeenCalledTimes(2);
  expect(onProgress).toHaveBeenCalledTimes(2);
});

test("ignores overlong output lines as progress markers", () => {
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^x+$/u,
    resetOnAnyOutput: false,
    resetProgressTimer: jest.fn(),
    onProgress,
  });
  progress.push("x".repeat(5000));
  progress.push("\n");
  progress.push(`${"x".repeat(5000)}\n`);
  expect(onProgress).not.toHaveBeenCalled();
});

test("does not recognize an overlong line reconstructed across chunks", () => {
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^abcdetail$/u,
    maxProgressLineLength: 4,
    resetOnAnyOutput: false,
    resetProgressTimer: jest.fn(),
    onProgress,
  });
  progress.push("abcd");
  progress.push("e");
  progress.push("tail");
  progress.push("\n");

  expect(onProgress).not.toHaveBeenCalled();
});

test("accepts unbounded progress lines when the caller opts in", () => {
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^x+$/u,
    maxProgressLineLength: Number.MAX_SAFE_INTEGER,
    resetOnAnyOutput: false,
    resetProgressTimer: jest.fn(),
    onProgress,
  });
  const longLine = "x".repeat(5000);
  progress.push(`${longLine}\n`);
  expect(onProgress).toHaveBeenCalledWith(longLine);
});

test("keeps later complete lines after an overlong line and ignores its flush", () => {
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^valid$/u,
    resetOnAnyOutput: false,
    resetProgressTimer: jest.fn(),
    onProgress,
  });
  progress.push("x".repeat(5000));
  progress.push("\nvalid\n");
  expect(onProgress).toHaveBeenCalledTimes(1);
  expect(onProgress).toHaveBeenCalledWith("valid");

  progress.push("x".repeat(5000));
  progress.flush();
  expect(onProgress).toHaveBeenCalledTimes(1);
});

test("resets the watchdog for any observable output when enabled", () => {
  const resetProgressTimer = jest.fn();
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^progress$/u,
    resetOnAnyOutput: true,
    resetProgressTimer,
    onProgress,
  });

  progress.push("ordinary output\n");

  expect(resetProgressTimer).toHaveBeenCalledTimes(1);
  expect(onProgress).not.toHaveBeenCalled();
  progress.push(Buffer.alloc(0));
  expect(resetProgressTimer).toHaveBeenCalledTimes(1);
});

test("uses redacted progress text when recognizing reporter output", () => {
  const resetProgressTimer = jest.fn();
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^safe progress$/u,
    redactProgressText: () => "safe progress",
    resetProgressTimer,
    onProgress,
  });

  progress.push("secret progress\n");

  expect(resetProgressTimer).toHaveBeenCalledTimes(1);
  expect(onProgress).toHaveBeenCalledWith("safe progress");
});

test("forwards recognized activity without resetting the timer a second time", () => {
  const resetProgressTimer = jest.fn();
  expect(
    handleChildProgress("progress", {
      progressPattern: /^progress$/u,
      resetOnAnyOutput: true,
      resetProgressTimer,
    }),
  ).toBe(true);
  expect(resetProgressTimer).not.toHaveBeenCalled();
});
