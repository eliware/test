export function terminateChild(child, platform = process.platform) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
    child.kill();
    return true;
  }
  try {
    if (Number.isInteger(child.pid) && child.pid > 0) process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  return true;
}
