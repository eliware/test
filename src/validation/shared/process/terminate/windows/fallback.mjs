import { resolveTaskkillExecutable } from "../../resolve-windows/taskkill-executable.mjs";
import { runWindowsProcessTreeFallback } from "../../run/windows-process-tree-fallback.mjs";

export function attemptWindowsProcessTreeFallbacks(
  pid,
  env,
  execute,
  options,
  waitForExit,
  resolvePowerShellCore,
) {
  const failures = [];
  try {
    execute(resolveTaskkillExecutable(env), ["/pid", String(pid), "/t", "/f"], options);
  } catch (error) {
    failures.push(error);
  }
  if (!waitForExit(pid)) {
    try {
      runWindowsProcessTreeFallback(pid, env, execute, options, resolvePowerShellCore);
    } catch (error) {
      failures.push(error);
    }
  }
  return failures.length
    ? new AggregateError(failures, "Windows process-tree termination failed.")
    : null;
}
