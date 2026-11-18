import createSuiteTimeoutTracker from "../../../../../stages/jest/progress/create/suite-timeout-tracker.mjs";
export default function createSuiteTimeouts(
  options,
  createTimeout,
  getTermination,
  createSuiteTracker = createSuiteTimeoutTracker,
) {
  let tracker;
  return {
    start() {
      tracker = createSuiteTracker(options, createTimeout, getTermination);
    },
    stop() {
      tracker?.stop();
    },
    get() {
      return tracker;
    },
  };
}
