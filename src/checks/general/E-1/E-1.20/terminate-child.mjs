import { execFileSync } from "node:child_process";

function defaultKillTree(pid) {
  execFileSync("taskkill.exe", ["/pid", String(pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
}

export function terminateChild(child, platform = process.platform, killProcess = process.kill, killTree = defaultKillTree) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
    if (Number.isInteger(child.pid) && child.pid > 0) {
      try { killTree(child.pid); return true; } catch {}
    }
    child.kill();
    return true;
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
