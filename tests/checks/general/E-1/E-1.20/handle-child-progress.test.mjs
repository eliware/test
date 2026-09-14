import { expect, jest, test } from "@jest/globals";
import { handleChildProgress } from "../../../../../src/checks/general/E-1/E-1.20/handle-child-progress.mjs";

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
