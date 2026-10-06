import { expect, jest, test } from "@jest/globals";
import { createSuiteTimeoutTracker } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/create-suite-timeout-tracker.mjs";

test("tracks one active suite and stops stale timers when the next suite starts", () => {
  const callbacks = new Map();
  const reset = jest.fn();
  const stop = jest.fn();
  const onSuiteTimeout = jest.fn();
  const termination = { onTimeout: jest.fn() };
  const tracker = createSuiteTimeoutTracker(
    { suiteTimeoutMs: 5_000, onSuiteTimeout },
    ({ onTimeout: callback }) => {
      callbacks.set(callbacks.size, callback);
      return { reset, stop };
    },
    () => termination,
  );

  tracker.start("fast.test.mjs");
  tracker.start("slow.test.mjs");
  tracker.end("fast.test.mjs");
  callbacks.get(1)();

  expect(reset).toHaveBeenCalledTimes(2);
  expect(stop).toHaveBeenCalledTimes(1);
  expect(onSuiteTimeout).toHaveBeenCalledWith("slow.test.mjs");
  expect(termination.onTimeout).toHaveBeenCalledWith(false);
  tracker.stop();
  expect(stop).toHaveBeenCalledTimes(2);
});

test("does not create suite timers when the deadline is disabled", () => {
  const createTimeout = jest.fn();
  const tracker = createSuiteTimeoutTracker({ suiteTimeoutMs: 0 }, createTimeout, jest.fn());

  tracker.start("test.mjs");
  tracker.end("test.mjs");
  tracker.stop();

  expect(createTimeout).not.toHaveBeenCalled();
});
