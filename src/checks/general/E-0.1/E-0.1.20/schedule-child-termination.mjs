export function scheduleChildTermination(child, options, onUnconfirmed) {
  const terminate = (signal) =>
    options.terminateChild(
      child,
      options.platform,
      options.killProcess,
      options.killTree,
      options.environment,
      signal,
    );
  terminate("SIGTERM");
  let timer = setTimeout(() => {
    terminate("SIGKILL");
    timer = setTimeout(onUnconfirmed, options.forceKillConfirmationMs);
  }, options.terminationGraceMs);
  return () => clearTimeout(timer);
}
