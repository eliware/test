function waitSynchronously(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

export function waitForProcessExit(pid, isRunning, options = {}) {
  const timeoutMs = options.timeoutMs ?? 1_000;
  const intervalMs = options.intervalMs ?? 25;
  const now = options.now ?? Date.now;
  const wait = options.wait ?? waitSynchronously;
  const deadline = now() + timeoutMs;
  while (isRunning(pid)) {
    const remaining = deadline - now();
    if (remaining <= 0) return false;
    wait(Math.min(intervalMs, remaining));
  }
  return true;
}
