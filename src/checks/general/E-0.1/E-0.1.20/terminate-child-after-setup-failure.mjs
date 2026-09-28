import { terminateChild } from "./terminate-child.mjs";

export function terminateChildAfterSetupFailure(child, options, environment) {
  try {
    const terminate = options.terminateChild ?? terminateChild;
    const terminated = terminate(
      child,
      options.terminationPlatform ?? process.platform,
      options.killProcess ?? process.kill,
      options.killTree,
      environment,
      "SIGTERM",
    );
    if (terminated === false) child.kill?.("SIGTERM");
  } catch {
    try {
      child.kill?.("SIGTERM");
    } catch {}
  }
}
