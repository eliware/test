import { execFileSync } from "node:child_process";
import { join } from "node:path";

export function resolveTaskkillExecutable(env = process.env) {
  if (!env.SystemRoot) throw new Error("Windows process-tree termination requires SystemRoot.");
  return join(env.SystemRoot, "System32", "taskkill.exe");
}

function defaultKillTree(pid, env) {
  killWindowsProcessTree(pid, env);
}

export function killWindowsProcessTree(pid, env = process.env, execute = execFileSync) {
  execute(resolveTaskkillExecutable(env), ["/pid", String(pid), "/t", "/f"], {
    windowsHide: true,
    stdio: "ignore",
    timeout: 1_000,
  });
}

export function terminateChild(
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
      } catch {}
    }
    try {
      return child.kill(signal) !== false;
    } catch {
      return false;
    }
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
}
