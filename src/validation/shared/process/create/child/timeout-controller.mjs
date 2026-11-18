import createSuiteTimeouts from "./timeout-controller/suites.mjs";
export default function createChildTimeoutController(
  options,
  createTimeout,
  getTermination,
  createSuiteTracker,
) {
  let progressTimeout;
  let runtimeTimeout;
  const suites = createSuiteTimeouts(options, createTimeout, getTermination, createSuiteTracker);
  return {
    timeout: {
      reset: () => progressTimeout?.reset(),
      stop() {
        progressTimeout?.stop();
        suites.stop();
        runtimeTimeout?.stop();
      },
    },
    start() {
      suites.start();
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
    suiteTimeout: () => suites.get(),
  };
}
