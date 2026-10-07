import { expect, jest, test } from "@jest/globals";
import { createProgressTimeout } from "../../../../../src/validation/stages/jest/progress/create-progress-timeout.mjs";

test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  "does not schedule a timer for disabled or invalid timeout %s",
  (timeoutMs) => {
    const onTimeout = jest.fn();
    const timeout = createProgressTimeout({ timeoutMs, onTimeout });
    timeout.reset();
    expect(timeout.wasTriggered()).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
    timeout.stop();
  },
);

test("reports a timed-out process", () => {
  jest.useFakeTimers();
  let callback;
  const originalSetTimeout = global.setTimeout;
  const setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((handler, delay) => {
    callback = handler;
    return originalSetTimeout(handler, delay);
  });
  const onTimeout = jest.fn();
  const timeout = createProgressTimeout({ timeoutMs: 15, onTimeout });
  try {
    timeout.reset();
    jest.advanceTimersByTime(14);
    expect(timeout.wasTriggered()).toBe(false);
    jest.advanceTimersByTime(1);
    expect(timeout.wasTriggered()).toBe(true);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    callback();
    expect(onTimeout).toHaveBeenCalledTimes(1);
  } finally {
    timeout.stop();
    setTimeoutSpy.mockRestore();
    jest.useRealTimers();
  }
});
