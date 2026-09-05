/** Capture a spawned child's output and settle on its error/close lifecycle. */
export function monitorChildProcess(child, capture, { timeoutMs = 120000 } = {}) {
  return new Promise((resolveResult) => {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) { resolveResult({ code: 1, output: 'Invalid child process timeout\n' }); return; }
    if (!child || typeof child.on !== 'function' || !child.stdout || typeof child.stdout.on !== 'function' || !child.stderr || typeof child.stderr.on !== 'function') {
      resolveResult({ code: 1, output: 'Invalid child process interface\n' });
      return;
    }
    let settled = false;
    let closed = false;
    let timeout;
    let forceKill;
    let finalKill;
    const finish = (code, errorMessage) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const output = capture.finish();
      const duplicate = errorMessage && output.includes(errorMessage.trim());
      resolveResult({ code, output: `${output}${duplicate ? '' : errorMessage}` });
    };
    try {
      child.stdout.on('data', capture.capture('stdout'));
      child.stderr.on('data', capture.capture('stderr'));
      child.on('error', (error) => {
        closed = true;
        finish(1, `${error.message}\n`);
      });
      child.on('close', (code) => {
        closed = true;
        finish(Number.isInteger(code) && code >= 0 ? code : 1, '');
      });
    } catch (error) {
      finish(1, `${error.message}\n`);
      return;
    }
    const terminate = (signal) => {
      try {
        if (Number.isInteger(child.pid) && child.pid > 0) process.kill(-child.pid, signal);
      } catch { /* fall back to the direct child */ }
      try { child.kill?.(signal); } catch { /* continue escalation */ }
    };
    timeout = setTimeout(() => {
      terminate('SIGTERM');
      if (closed) return;
      forceKill = setTimeout(() => {
        if (closed) return;
        terminate('SIGKILL');
        finalKill = setTimeout(() => {
          if (closed) return;
          terminate('SIGKILL');
          finish(1, `Child process timed out after ${timeoutMs} ms\nChild process remained alive after SIGKILL\n`);
        }, 1000);
        finalKill.unref?.();
      }, 1000);
      forceKill.unref?.();
    }, timeoutMs);
  });
}
