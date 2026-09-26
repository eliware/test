import { execFileSync } from "node:child_process";
import { join } from "node:path";

export function resolveTaskkillExecutable(env = process.env) {
  if (!env.SystemRoot) throw new Error("Windows process-tree termination requires SystemRoot.");
  return join(env.SystemRoot, "System32", "taskkill.exe");
}

function defaultKillTree(pid, env) {
  execFileSync(resolveTaskkillExecutable(env), ["/pid", String(pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
}

export function terminateChild(child, platform = process.platform, killProcess = process.kill, killTree = defaultKillTree, env = process.env) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
    if (Number.isInteger(child.pid) && child.pid > 0) {
      try { killTree(child.pid, env); return true; } catch {}
    }
    try {
      return child.kill("SIGTERM") !== false;
    } catch {
      return false;
    }
  }
  if (Number.isInteger(child.pid) && child.pid > 0) {
    try {
      killProcess(-child.pid, "SIGTERM");
      return true;
    } catch {}
  }
  try {
    child.kill("SIGTERM");
  } catch {
    return false;
  }
  return true;
}
