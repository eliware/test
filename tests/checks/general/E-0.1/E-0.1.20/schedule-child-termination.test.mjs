import { expect, jest, test } from "@jest/globals";
import { scheduleChildTermination } from "../../../../../src/checks/general/E-0.1/E-0.1.20/schedule-child-termination.mjs";

function options(signals) {
  return {
    terminateChild: (_child, _platform, _killProcess, _killTree, _environment, signal) =>
      signals.push(signal),
    platform: "linux",
    killProcess: jest.fn(),
    killTree: jest.fn(),
    environment: {},
    terminationGraceMs: 50,
    forceKillConfirmationMs: 75,
  };
}

test("requests graceful termination, escalates, and reports unconfirmed closure", () => {
  jest.useFakeTimers();
  try {
    const signals = [];
    const onUnconfirmed = jest.fn();
    scheduleChildTermination({}, options(signals), onUnconfirmed);
    expect(signals).toEqual(["SIGTERM"]);
    jest.advanceTimersByTime(50);
    expect(signals).toEqual(["SIGTERM", "SIGKILL"]);
    jest.advanceTimersByTime(75);
    expect(onUnconfirmed).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

test("cancels pending escalation or confirmation timers after child close", () => {
  jest.useFakeTimers();
  try {
    const signals = [];
    const onUnconfirmed = jest.fn();
    const cancel = scheduleChildTermination({}, options(signals), onUnconfirmed);
    cancel();
    jest.runOnlyPendingTimers();
    expect(signals).toEqual(["SIGTERM"]);
    expect(onUnconfirmed).not.toHaveBeenCalled();

    const nextSignals = [];
    const cancelAfterEscalation = scheduleChildTermination({}, options(nextSignals), onUnconfirmed);
    jest.advanceTimersByTime(50);
    cancelAfterEscalation();
    jest.runOnlyPendingTimers();
    expect(nextSignals).toEqual(["SIGTERM", "SIGKILL"]);
    expect(onUnconfirmed).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

test("contains termination adapter exceptions and still confirms its timeout", () => {
  jest.useFakeTimers();
  try {
    const terminateChild = jest.fn(() => { throw new Error("termination failed"); });
    const onUnconfirmed = jest.fn();
    scheduleChildTermination({}, { ...options([]), terminateChild }, onUnconfirmed);
    jest.advanceTimersByTime(125);
    expect(terminateChild).toHaveBeenCalledTimes(2);
    expect(onUnconfirmed).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

test("reports tree-termination outcomes for graceful and forced attempts", () => {
  jest.useFakeTimers();
  try {
    const outcomes = [];
    const settings = { ...options([]), terminateChild: jest.fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true) };
    scheduleChildTermination({}, settings, jest.fn(), (confirmed) => outcomes.push(confirmed));
    jest.advanceTimersByTime(50);
    expect(outcomes).toEqual([false, true]);
  } finally {
    jest.useRealTimers();
  }
});
