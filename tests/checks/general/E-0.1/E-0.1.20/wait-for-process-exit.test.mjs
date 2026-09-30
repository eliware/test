import { expect, jest, test } from "@jest/globals";
import { waitForProcessExit } from "../../../../../src/checks/general/E-0.1/E-0.1.20/wait-for-process-exit.mjs";

test("waits until the process is observed closed", () => {
  let checks = 0;
  const wait = jest.fn();
  expect(waitForProcessExit(42, () => ++checks < 3, { wait, now: () => 0, timeoutMs: 100 })).toBe(
    true,
  );
  expect(wait).toHaveBeenCalledTimes(2);
});

test("returns false when the process remains alive through the timeout", () => {
  let time = 0;
  expect(
    waitForProcessExit(42, () => true, {
      now: () => time,
      wait: (duration) => {
        time += duration;
      },
      timeoutMs: 50,
      intervalMs: 20,
    }),
  ).toBe(false);
});

test("returns immediately when the process is already closed", () => {
  const wait = jest.fn();
  expect(waitForProcessExit(42, () => false, { wait })).toBe(true);
  expect(wait).not.toHaveBeenCalled();
});

test("uses the synchronous default wait until closure is observed", () => {
  let checks = 0;
  expect(waitForProcessExit(42, () => ++checks < 2)).toBe(true);
  expect(checks).toBe(2);
});
