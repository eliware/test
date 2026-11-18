import { expect, jest, test } from "@jest/globals";
import createSuiteTimeouts from "../../../../../../../src/validation/shared/process/create/child/timeout-controller/suites.mjs";
test("starts and stops the suite timeout tracker", () => {
  const tracker = { stop: jest.fn() };
  const createTracker = jest.fn(() => tracker);
  const suites = createSuiteTimeouts({}, jest.fn(), jest.fn(), createTracker);
  expect(suites.get()).toBeUndefined();
  suites.stop();
  suites.start();
  expect(suites.get()).toBe(tracker);
  suites.stop();
  expect(createTracker).toHaveBeenCalledTimes(1);
  expect(tracker.stop).toHaveBeenCalledTimes(1);
});
