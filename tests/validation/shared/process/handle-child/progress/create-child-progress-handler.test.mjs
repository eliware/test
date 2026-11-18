import { expect, jest, test } from "@jest/globals";
import createChildProgressHandler from "../../../../../../src/validation/shared/process/handle-child/progress/create-child-progress-handler.mjs";

test("filters, redacts, and reports progress while resetting its timer", () => {
  const resetProgressTimer = jest.fn();
  const onProgress = jest.fn();
  const handler = createChildProgressHandler({
    progressPattern: /^progress/u,
    resetOnAnyOutput: false,
    resetProgressTimer,
    onProgress,
    redactProgressText: (text) => (text.includes("secret") ? "" : text),
  });
  handler.push("ordinary output\nprogress 1\nprogress secret\n");
  expect(onProgress).toHaveBeenCalledWith("progress 1");
  expect(onProgress).not.toHaveBeenCalledWith("progress secret");
  expect(resetProgressTimer).toHaveBeenCalledTimes(2);
});
test("resets progress on any output when configured", () => {
  const resetProgressTimer = jest.fn();
  const handler = createChildProgressHandler({
    progressPattern: /^progress/u,
    resetOnAnyOutput: true,
    resetProgressTimer,
  });
  handler.push("ordinary\nprogress 2\n");
  expect(resetProgressTimer).toHaveBeenCalledTimes(1);
});
