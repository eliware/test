/** Escalate termination for a child and its supported POSIX process group. */
export function terminateChildProcess(child, signal, platform = process.platform, kill = process.kill) {
  try {
    if ((platform === 'linux' || platform === 'darwin') && child.__eliwareProcessGroup === true && Number.isInteger(child.pid) && child.pid > 0) kill(-child.pid, signal);
  } catch { /* fall back to the direct child */ }
  try { child.kill?.(signal); } catch { /* continue escalation */ }
}
