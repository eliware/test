export function terminateChild(child, platform = process.platform, killProcess = process.kill) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
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
