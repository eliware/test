export function createOutdatedDependenciesOverflowHandler({
  child,
  maxOutputLength,
  terminationGracePeriodMs,
  terminateProcess,
  platform,
  killProcess,
  killTree,
  env,
  onGracePeriodExpired,
}) {
  let terminationTimer;
  let started = false;

  const terminate = (signal) => {
    try {
      terminateProcess(child, platform, killProcess, killTree, env, signal);
    } catch {}
  };

  return {
    start() {
      if (started) return;
      started = true;
      terminate("SIGTERM");
      terminationTimer = setTimeout(() => {
        terminate("SIGKILL");
        onGracePeriodExpired(new Error(`npm outdated output exceeded ${maxOutputLength} characters.`));
      }, terminationGracePeriodMs);
    },
    cancel() {
      clearTimeout(terminationTimer);
    },
    createError() {
      return new Error(`npm outdated output exceeded ${maxOutputLength} characters.`);
    },
  };
}
