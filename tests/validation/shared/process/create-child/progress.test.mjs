import { expect, jest, test } from "@jest/globals";
import { createChildProgress } from "../../../../../src/validation/shared/process/create-child/progress.mjs";

test("connects suite callbacks and resets the progress timeout", () => {
  const start = jest.fn(() => true);
  const end = jest.fn(() => true);
  const reset = jest.fn();
  const timeoutController = { suiteTimeout: () => ({ start, end }) };
  const progress = createChildProgress(
    {
      isSettled: () => false,
      progressPattern: /progress/u,
      onProgress() {
        this.onSuiteStart("suite");
        this.onSuiteEnd("suite");
      },
    },
    timeoutController,
    { reset },
    {},
  );
  progress.push("progress\n");
  expect(start).toHaveBeenCalledWith("suite");
  expect(end).toHaveBeenCalledWith("suite");
  expect(reset).toHaveBeenCalled();
});

test("uses caller callbacks and skips timer resets after settlement", () => {
  const start = jest.fn();
  const end = jest.fn();
  const reset = jest.fn();
  const onSuiteStart = jest.fn();
  const onSuiteEnd = jest.fn();
  const timeoutController = { suiteTimeout: () => ({ start, end }) };
  const progress = createChildProgress(
    {
      isSettled: () => true,
      progressPattern: /progress/u,
      onSuiteStart,
      onSuiteEnd,
      onProgress() {
        this.onSuiteStart("suite");
        this.onSuiteEnd("suite");
      },
    },
    timeoutController,
    { reset },
    {},
  );
  progress.push("progress\n");
  expect(onSuiteStart).toHaveBeenCalledWith("suite");
  expect(onSuiteEnd).toHaveBeenCalledWith("suite");
  expect(reset).not.toHaveBeenCalled();
});
