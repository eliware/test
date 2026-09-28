import { expect, jest, test } from "@jest/globals";
import { createChildProcessErrorHandler } from "../../../../../src/checks/general/E-0.1/E-0.1.20/handle-child-process-error.mjs";

test("settles once, stops process handlers, and redacts error details", () => {
  let settled = false;
  const timeout = { stop: jest.fn() };
  const termination = { cancel: jest.fn() };
  const reject = jest.fn();
  const handler = createChildProcessErrorHandler({
    isSettled: () => settled,
    markSettled: () => {
      settled = true;
    },
    getTimeout: () => timeout,
    getTermination: () => termination,
    output: { redactComplete: (text) => text.replace("private", "[REDACTED]") },
    reject,
  });

  handler(new Error("private failure"));
  handler("late failure");

  expect(timeout.stop).toHaveBeenCalledTimes(1);
  expect(termination.cancel).toHaveBeenCalledTimes(1);
  expect(reject).toHaveBeenCalledWith(new Error("[REDACTED] failure"));
});

test("handles non-Error and empty diagnostics when cleanup callbacks fail", () => {
  const reject = jest.fn();
  let settled = false;
  const handler = createChildProcessErrorHandler({
    isSettled: () => settled,
    markSettled: () => {
      settled = true;
    },
    getTimeout: () => ({
      stop: () => {
        throw new Error("timeout stop failure");
      },
    }),
    getTermination: () => ({
      cancel: () => {
        throw new Error("cancel failure");
      },
    }),
    output: { redactComplete: () => "" },
    reject,
  });
  handler("launch failure");
  expect(reject).toHaveBeenCalledWith(new Error("Child process could not be started."));
  handler(new Error("late"));
  expect(reject).toHaveBeenCalledTimes(1);
});

test("returns early when another event already settled the child", () => {
  const reject = jest.fn();
  const handler = createChildProcessErrorHandler({
    isSettled: () => true,
    markSettled: jest.fn(),
    getTimeout: jest.fn(),
    getTermination: jest.fn(),
    output: { redactComplete: jest.fn() },
    reject,
  });
  handler(new Error("late"));
  expect(reject).not.toHaveBeenCalled();
});

test("settles without timeout or termination handlers", () => {
  let settled = false;
  const reject = jest.fn();
  const handler = createChildProcessErrorHandler({
    isSettled: () => settled,
    markSettled: () => {
      settled = true;
    },
    getTimeout: () => undefined,
    getTermination: () => undefined,
    output: { redactComplete: (text) => text },
    reject,
  });
  handler("spawn error");
  expect(reject).toHaveBeenCalledWith(new Error("spawn error"));
});
