export function isProcessRunning(pid, check = process.kill) {
  try {
    check(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}
