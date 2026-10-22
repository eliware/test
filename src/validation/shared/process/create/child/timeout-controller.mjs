import { createSuiteTimeoutTracker } from "../../../../stages/jest/progress/create/suite-timeout-tracker.mjs";

export function createChildTimeoutController(
  options,
  createTimeout,
  getTermination,
  createSuiteTracker = createSuiteTimeoutTracker,
) {
  let progressTimeout;
  let suiteTimeout;
  let runtimeTimeout;
  return {
    timeout: {
      reset: () => progressTimeout?.reset(),
      stop() {
        progressTimeout?.stop();
        suiteTimeout?.stop();
        runtimeTimeout?.stop();
      },
    },
    start() {
      suiteTimeout = createSuiteTracker(options, createTimeout, getTermination);
      progressTimeout = createTimeout({
        timeoutMs: options.progressTimeoutMs,
        onTimeout: () => getTermination().onTimeout(),
      });
      if (options.maxRuntimeMs > 0) {
        runtimeTimeout = createTimeout({
          timeoutMs: options.maxRuntimeMs,
          onTimeout: () => getTermination().onTimeout(),
        });
        runtimeTimeout.reset();
      }
    },
    suiteTimeout: () => suiteTimeout,
  };
}
