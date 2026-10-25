import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { registerChildLifecycle } from "../../../../../src/validation/shared/process/run/lifecycle.mjs";

test("starts timeout control and connects child output and completion events", () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  const timeout = { reset: jest.fn(), stop: jest.fn() };
  const timeoutController = { start: jest.fn(), suiteTimeout: jest.fn() };
  const output = {
    stdout: jest.fn(),
    stderr: jest.fn(),
    flush: jest.fn(),
    result: () => ({ stdout: "out", stderr: "err" }),
    redactComplete: (text) => text,
  };
  const resolve = jest.fn();
  const settleError = jest.fn();
  const setTermination = jest.fn();
  let settled = false;

  registerChildLifecycle(child, {
    options: {},
    environment: {},
    timeout,
    timeoutController,
    output,
    resolve,
    isSettled: () => settled,
    markSettled: () => {
      settled = true;
    },
    settleError,
    setTermination,
  });

  expect(timeoutController.start).toHaveBeenCalledTimes(1);
  expect(timeout.reset).toHaveBeenCalledTimes(1);
  expect(setTermination).toHaveBeenCalledTimes(1);
  child.stdout.emit("data", "out");
  child.stderr.emit("data", "err");
  child.emit("close", 0, null);

  expect(output.stdout).toHaveBeenCalledWith("out");
  expect(output.stderr).toHaveBeenCalledWith("err");
  expect(output.flush).toHaveBeenCalledTimes(1);
  expect(timeout.stop).toHaveBeenCalledTimes(1);
  expect(resolve).toHaveBeenCalledWith({ code: 0, signal: null, stdout: "out", stderr: "err" });
  expect(settleError).not.toHaveBeenCalled();
  expect(settled).toBe(true);
});
