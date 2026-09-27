import { expect, jest, test } from "@jest/globals";
import { createChildTerminationHandler } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-child-termination-handler.mjs";

function createHandler(options = {}, settledState = { value: false }) {
  const resolve = jest.fn();
  const timeout = { stop: jest.fn() };
  const output = { flush: jest.fn(), result: () => ({ stdout: "", stderr: "" }) };
  const handler = createChildTerminationHandler({
    child: {},
    options: { terminationGraceMs: 10, forceKillConfirmationMs: 10, ...options },
    environment: {},
    timeout,
    output,
    resolve,
    isSettled: () => settledState.value,
    markSettled: () => {
      settledState.value = true;
    },
  });
  return { handler, resolve, timeout, output, settledState };
}

test("settles as unconfirmed after graceful and forced termination", () => {
  jest.useFakeTimers();
  try {
    const { handler, resolve, timeout, output, settledState } = createHandler();
    handler.cancel();
    expect(handler.wasTimedOut()).toBe(false);
    handler.onTimeout();
    expect(handler.wasTimedOut()).toBe(true);
    jest.advanceTimersByTime(20);
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        terminationConfirmed: false,
        signal: "SIGKILL",
      }),
    );
    expect(settledState.value).toBe(true);
    expect(timeout.stop).toHaveBeenCalledTimes(2);
    expect(output.flush).toHaveBeenCalledTimes(1);
    handler.cancel();
    handler.onTimeout();
  } finally {
    jest.useRealTimers();
  }
});

test("uses explicit termination options and ignores late unconfirmed callbacks", () => {
  jest.useFakeTimers();
  try {
    const terminateChild = jest.fn();
    const { handler, resolve, settledState } = createHandler({
      terminateChild,
      terminationPlatform: "win32",
      killProcess: jest.fn(),
      terminationGraceMs: null,
      forceKillConfirmationMs: null,
    });
    handler.onTimeout();
    settledState.value = true;
    jest.advanceTimersByTime(2000);
    expect(terminateChild).toHaveBeenCalledTimes(2);
    expect(resolve).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

test("contains timeout callback and termination errors while settling", () => {
  jest.useFakeTimers();
  try {
    const { handler, resolve } = createHandler({
      onTimeout: () => {
        throw new Error("timeout callback failure");
      },
      terminateChild: () => {
        throw new Error("termination failure");
      },
    });
    handler.onTimeout();
    jest.advanceTimersByTime(20);
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ terminationConfirmed: false }));
  } finally {
    jest.useRealTimers();
  }
});

test("ignores a timeout callback after the child has settled", () => {
  const timeout = { stop: jest.fn() };
  const handler = createChildTerminationHandler({
    child: {},
    options: {},
    environment: {},
    timeout,
    output: {},
    resolve: jest.fn(),
    isSettled: () => true,
    markSettled: jest.fn(),
  });
  handler.onTimeout();
  expect(timeout.stop).not.toHaveBeenCalled();
  expect(handler.wasTimedOut()).toBe(false);
});
