import { expect, jest, test } from "@jest/globals";
import { createUnconfirmedTerminationSettlement } from "../../../../../../../src/validation/shared/process/create/child/termination/settle-unconfirmed.mjs";

test("settles once with captured output after termination cannot be confirmed", () => {
  const state = { settled: false };
  const timeout = { stop: jest.fn() };
  const output = {
    flush: jest.fn(),
    result: jest.fn(() => ({ stdout: "out", stderr: "err" })),
  };
  const resolve = jest.fn();
  const settle = createUnconfirmedTerminationSettlement({
    isSettled: () => state.settled,
    markSettled: () => {
      state.settled = true;
    },
    timeout,
    output,
    resolve,
  });

  settle();
  settle();

  expect(resolve).toHaveBeenCalledTimes(1);
  expect(resolve).toHaveBeenCalledWith({
    code: null,
    signal: "SIGKILL",
    stdout: "out",
    stderr: "err",
    timedOut: true,
    terminationRequested: true,
    terminationConfirmed: false,
  });
  expect(timeout.stop).toHaveBeenCalledTimes(1);
  expect(output.flush).toHaveBeenCalledTimes(1);
});

test("ignores settlement after another result has completed", () => {
  const timeout = { stop: jest.fn() };
  const output = { flush: jest.fn(), result: jest.fn() };
  const resolve = jest.fn();
  const settle = createUnconfirmedTerminationSettlement({
    isSettled: () => true,
    markSettled: jest.fn(),
    timeout,
    output,
    resolve,
  });

  settle();

  expect(timeout.stop).not.toHaveBeenCalled();
  expect(output.flush).not.toHaveBeenCalled();
  expect(resolve).not.toHaveBeenCalled();
});
