export function createSuiteTimeoutTracker(options, createTimeout, getTermination) {
  const timeouts = new Map();
  return {
    start(path) {
      if (!options.suiteTimeoutMs) return;
      timeouts.get(path)?.stop();
      const timeout = createTimeout({
        timeoutMs: options.suiteTimeoutMs,
        onTimeout: () => {
          options.onSuiteTimeout?.(path);
          getTermination().onTimeout(false);
        },
      });
      timeouts.set(path, timeout);
      timeout.reset();
    },
    end(path) {
      const timeout = timeouts.get(path);
      if (!timeout) return;
      timeout.stop();
      timeouts.delete(path);
    },
    stop() {
      for (const timeout of timeouts.values()) timeout.stop();
      timeouts.clear();
    },
  };
}
