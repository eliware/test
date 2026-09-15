export function terminateChild(child, platform = process.platform, killProcess = process.kill) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
    child.kill();
    return true;
  }
  try {
    if (Number.isInteger(child.pid) && child.pid > 0) {
      killProcess(-child.pid, "SIGTERM");
      return true;
    }
    child.kill("SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  return true;
}
