import { expect, jest, test } from "@jest/globals";
import { createChildCloseHandler } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/handle-child-close.mjs";

function createHandler(overrides = {}) {
  const state = { settled: false };
  const dependencies = {
    isSettled: () => state.settled,
    markSettled: () => {
      state.settled = true;
    },
    flushOutput: jest.fn(),
    timeout: { stop: jest.fn() },
    termination: {
      cancel: jest.fn(),
      wasTimedOut: jest.fn(() => false),
      terminationConfirmed: jest.fn(() => true),
    },
    output: { result: jest.fn(() => ({ stdout: "out", stderr: "err" })) },
    settleError: jest.fn(),
    resolve: jest.fn(),
    ...overrides,
  };
  return { handleClose: createChildCloseHandler(dependencies), dependencies, state };
}

test("flushes and resolves output when the child closes normally", () => {
  const { handleClose, dependencies, state } = createHandler();

  handleClose(0, null);

  expect(dependencies.flushOutput).toHaveBeenCalledTimes(1);
  expect(dependencies.timeout.stop).toHaveBeenCalledTimes(1);
  expect(dependencies.termination.cancel).toHaveBeenCalledTimes(1);
  expect(state.settled).toBe(true);
  expect(dependencies.resolve).toHaveBeenCalledWith({
    code: 0,
    signal: null,
    stdout: "out",
    stderr: "err",
  });
});

test("ignores close events after the child has settled", () => {
  const { handleClose, dependencies } = createHandler({ isSettled: () => true });

  handleClose(1, null);

  expect(dependencies.flushOutput).not.toHaveBeenCalled();
  expect(dependencies.resolve).not.toHaveBeenCalled();
});

test("reports missing exit codes with or without a signal", () => {
  for (const [signal, message] of [
    ["SIGTERM", "Child process exited without an exit code (SIGTERM)."],
    [null, "Child process exited without an exit code."],
  ]) {
    const { handleClose, dependencies } = createHandler();
    handleClose(null, signal);
    expect(dependencies.settleError).toHaveBeenCalledWith(new Error(message));
    expect(dependencies.resolve).not.toHaveBeenCalled();
  }
});

test("resolves timed-out children with termination status", () => {
  const termination = {
    cancel: jest.fn(),
    wasTimedOut: jest.fn(() => true),
    terminationConfirmed: jest.fn(() => false),
  };
  const { handleClose, dependencies } = createHandler({ termination });

  handleClose(null, "SIGTERM");

  expect(dependencies.resolve).toHaveBeenCalledWith({
    code: null,
    signal: "SIGTERM",
    stdout: "out",
    stderr: "err",
    timedOut: true,
    terminationRequested: true,
    terminationConfirmed: false,
  });
  expect(termination.terminationConfirmed).toHaveBeenCalledTimes(1);
});
