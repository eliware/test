import { afterEach, expect, jest, test } from "@jest/globals";
import { createOutdatedDependenciesOverflowHandler } from "../../../../src/checks/general/E-0.1/create-outdated-dependencies-overflow-handler.mjs";

afterEach(() => {
  jest.useRealTimers();
});

function createHandler(overrides = {}) {
  const terminateProcess = jest.fn();
  const onGracePeriodExpired = jest.fn();
  const handler = createOutdatedDependenciesOverflowHandler({
    child: { pid: 123 },
    maxOutputLength: 100,
    terminationGracePeriodMs: 25,
    terminateProcess,
    platform: "linux",
    killProcess: jest.fn(),
    killTree: jest.fn(),
    env: {},
    onGracePeriodExpired,
    ...overrides,
  });
  return { handler, terminateProcess, onGracePeriodExpired };
}

test("starts termination once and escalates after the grace period", () => {
  jest.useFakeTimers();
  const { handler, terminateProcess, onGracePeriodExpired } = createHandler();

  handler.start();
  handler.start();
  expect(terminateProcess).toHaveBeenCalledTimes(1);
  expect(terminateProcess).toHaveBeenCalledWith(
    { pid: 123 },
    "linux",
    expect.any(Function),
    expect.any(Function),
    {},
    "SIGTERM",
  );

  jest.advanceTimersByTime(25);
  expect(terminateProcess).toHaveBeenCalledTimes(2);
  expect(terminateProcess.mock.calls[1].at(-1)).toBe("SIGKILL");
  expect(onGracePeriodExpired).toHaveBeenCalledWith(
    new Error("npm outdated output exceeded 100 characters."),
  );
});

test("cancels escalation after the child settles", () => {
  jest.useFakeTimers();
  const { handler, terminateProcess, onGracePeriodExpired } = createHandler();

  handler.start();
  handler.cancel();
  jest.runOnlyPendingTimers();

  expect(terminateProcess).toHaveBeenCalledTimes(1);
  expect(onGracePeriodExpired).not.toHaveBeenCalled();
});

test("creates the output-limit diagnostic", () => {
  const { handler } = createHandler();

  expect(handler.createError()).toEqual(new Error("npm outdated output exceeded 100 characters."));
});
