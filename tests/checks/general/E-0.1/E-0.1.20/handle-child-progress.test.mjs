import { expect, jest, test } from "@jest/globals";
import { createChildProgressHandler, handleChildProgress } from "../../../../../src/checks/general/E-0.1/E-0.1.20/handle-child-progress.mjs";

test("resets the watchdog and forwards matching progress", () => {
  const resetProgressTimer = jest.fn();
  const onProgress = jest.fn();
  expect(handleChildProgress("progress", {
    progressPattern: /^progress$/,
    resetProgressTimer,
    onProgress,
  })).toBe(true);
  expect(resetProgressTimer).toHaveBeenCalledTimes(1);
  expect(onProgress).toHaveBeenCalledWith("progress");
});

test("ignores non-matching progress and optional callbacks", () => {
  const resetProgressTimer = jest.fn();
  expect(handleChildProgress("ordinary output", {
    progressPattern: /^progress$/,
    resetProgressTimer,
  })).toBe(false);
  expect(resetProgressTimer).not.toHaveBeenCalled();
});

test("recognizes a progress marker divided across chunks once", () => {
  const resetProgressTimer = jest.fn();
  const onProgress = jest.fn();
  const progress = createChildProgressHandler({
    progressPattern: /^\[eliware-test-progress\]/m,
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
