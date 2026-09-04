/** Capture a spawned child's output and settle on its error/close lifecycle. */
export function monitorChildProcess(child, capture, { timeoutMs = 120000 } = {}) {
  return new Promise((resolveResult) => {
    let settled = false;
    let processError = '';
    let timeout;
    const finish = (code, errorMessage) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolveResult({ code, output: capture.finish(errorMessage) });
    };
    child.stdout.on('data', capture.capture('stdout'));
    child.stderr.on('data', capture.capture('stderr'));
    child.on('error', (error) => {
      processError = `${error.message}\n`;
      finish(1, processError);
    });
    child.on('close', (code) => finish(processError ? 1 : (Number.isInteger(code) && code >= 0 ? code : 1), processError));
    timeout = setTimeout(() => {
      finish(1, `Child process timed out after ${timeoutMs} ms\n`);
      child.kill();
    }, timeoutMs);
  });
}
