import { expect, jest, test } from "@jest/globals";
import { createProgressTimeout } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-progress-timeout.mjs";

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
  const onTimeout = jest.fn();
  const timeout = createProgressTimeout({ timeoutMs: 15, onTimeout });
  timeout.reset();
  jest.advanceTimersByTime(15);
  expect(timeout.wasTriggered()).toBe(true);
  expect(onTimeout).toHaveBeenCalledTimes(1);
  timeout.stop();
  jest.useRealTimers();
});

test("does not invoke timeout repeatedly after the terminal callback", () => {
  let callback;
  const setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((handler) => {
    callback = handler;
    return 1;
  });
  const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
  const onTimeout = jest.fn();
  const timeout = createProgressTimeout({ timeoutMs: 5, onTimeout });
  timeout.reset();
  callback();
  callback();
  expect(onTimeout).toHaveBeenCalledTimes(1);
  timeout.stop();
  setTimeoutSpy.mockRestore();
  clearTimeoutSpy.mockRestore();
});
