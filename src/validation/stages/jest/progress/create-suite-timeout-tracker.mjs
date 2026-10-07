export function createSuiteTimeoutTracker(options, createTimeout, getTermination) {
  let activeSuite;
  let timeout;
  return {
    start(path) {
      if (!options.suiteTimeoutMs) return;
      timeout?.stop();
      activeSuite = path;
      timeout = createTimeout({
        timeoutMs: options.suiteTimeoutMs,
        onTimeout: () => {
          options.onSuiteTimeout?.(path);
          getTermination().onTimeout(false);
        },
      });
      timeout.reset();
    },
    end(path) {
      if (activeSuite !== path) return;
      timeout?.stop();
      activeSuite = undefined;
      timeout = undefined;
    },
    stop() {
      timeout?.stop();
      activeSuite = undefined;
      timeout = undefined;
    },
  };
}
