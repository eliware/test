export function scheduleChildTermination(child, options, onUnconfirmed, onAttempt) {
  const terminate = (signal) => {
    try {
      const result = options.terminateChild(
        child,
        options.platform,
        options.killProcess,
        options.killTree,
        options.environment,
        signal,
      );
      onAttempt?.(result !== false);
    } catch {
      onAttempt?.(false);
    }
  };
  terminate("SIGTERM");
  let timer = setTimeout(() => {
    terminate("SIGKILL");
    timer = setTimeout(onUnconfirmed, options.forceKillConfirmationMs);
  }, options.terminationGraceMs);
  return () => clearTimeout(timer);
}
