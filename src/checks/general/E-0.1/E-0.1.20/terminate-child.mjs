import { killWindowsProcessTree } from "./terminate-windows-process-tree.mjs";

export function createChildTerminator(defaultKillTree = killWindowsProcessTree) {
  return function terminateChild(
    child,
    platform = process.platform,
    killProcess = process.kill,
    killTree = defaultKillTree,
    env = process.env,
    signal = "SIGTERM",
  ) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
    if (Number.isInteger(child.pid) && child.pid > 0) {
      try {
        killTree(child.pid, env);
        return true;
      } catch {
        try { child.kill(signal); } catch {}
        return false;
      }
    }
    try {
      child.kill(signal);
    } catch {
      // The child cannot be safely addressed without its process-tree identifier.
    }
    return false;
  }
  if (Number.isInteger(child.pid) && child.pid > 0) {
    try {
      killProcess(-child.pid, signal);
      return true;
    } catch {}
  }
  try {
    child.kill(signal);
  } catch {
    return false;
  }
  return true;
  };
}

export const terminateChild = createChildTerminator();
