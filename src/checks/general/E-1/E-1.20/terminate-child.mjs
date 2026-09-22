export function terminateChild(child, platform = process.platform, killProcess = process.kill, killTree) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
    if (typeof killTree === "function" && Number.isInteger(child.pid) && child.pid > 0) {
      killTree(child.pid);
      return true;
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
