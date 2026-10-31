import { expect, jest, test } from "@jest/globals";
import { createSuiteTimeoutTracker } from "../../../../../../src/validation/stages/jest/progress/create/suite-timeout-tracker.mjs";

test("tracks each concurrent suite and stops its timeout when that suite ends", () => {
  const timeouts = new Map();
  const onSuiteTimeout = jest.fn();
  const termination = { onTimeout: jest.fn() };
  const tracker = createSuiteTimeoutTracker(
    { suiteTimeoutMs: 10_000, onSuiteTimeout },
    ({ onTimeout }) => {
      const timeout = { onTimeout, reset: jest.fn(), stop: jest.fn() };
      timeouts.set(timeouts.size, timeout);
      return timeout;
    },
    () => termination,
  );

  tracker.start("fast.test.mjs");
  tracker.start("slow.test.mjs");
  tracker.end("fast.test.mjs");
  timeouts.get(1).onTimeout();

  expect(timeouts.get(0).reset).toHaveBeenCalledTimes(1);
  expect(timeouts.get(1).reset).toHaveBeenCalledTimes(1);
  expect(timeouts.get(0).stop).toHaveBeenCalledTimes(1);
  expect(timeouts.get(1).stop).not.toHaveBeenCalled();
  expect(onSuiteTimeout).toHaveBeenCalledWith("slow.test.mjs");
  expect(termination.onTimeout).toHaveBeenCalledWith(false);
  tracker.end("slow.test.mjs");
  expect(timeouts.get(1).stop).toHaveBeenCalledTimes(1);
  tracker.start("pending.test.mjs");
  tracker.stop();
  expect(timeouts.get(2).stop).toHaveBeenCalledTimes(1);
  tracker.stop();
  expect(timeouts.get(2).stop).toHaveBeenCalledTimes(1);
});

test("does not create suite timers when the deadline is disabled", () => {
  const createTimeout = jest.fn();
  const tracker = createSuiteTimeoutTracker({ suiteTimeoutMs: 0 }, createTimeout, jest.fn());

  tracker.start("test.mjs");
  tracker.end("test.mjs");
  tracker.stop();

  expect(createTimeout).not.toHaveBeenCalled();
});
