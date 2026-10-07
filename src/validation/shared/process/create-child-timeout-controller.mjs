import { createSuiteTimeoutTracker } from "../../stages/jest/progress/create-suite-timeout-tracker.mjs";

export function createChildTimeoutController(
  options,
  createTimeout,
  getTermination,
  createSuiteTracker = createSuiteTimeoutTracker,
) {
  let progressTimeout;
  let suiteTimeout;
  return {
    timeout: {
      reset: () => progressTimeout?.reset(),
      stop() {
        progressTimeout?.stop();
        suiteTimeout?.stop();
      },
    },
    start() {
      suiteTimeout = createSuiteTracker(options, createTimeout, getTermination);
      progressTimeout = createTimeout({
        timeoutMs: options.progressTimeoutMs,
        onTimeout: () => getTermination().onTimeout(),
      });
    },
    suiteTimeout: () => suiteTimeout,
  };
}
