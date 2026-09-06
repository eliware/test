import { createTimingDecoder } from './decode-timing-output.mjs';
import { scheduleChildTimeout } from './schedule-child-timeout.mjs';

/** Capture a spawned child's output and settle on its error/close lifecycle. */
export function monitorChildProcess(child, capture, { timeoutMs = 120000, captureTiming = false } = {}) {
  return new Promise((resolveResult) => {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) { resolveResult({ code: 1, output: 'Invalid child process timeout\n' }); return; }
    if (!child || typeof child.on !== 'function' || !child.stdout || typeof child.stdout.on !== 'function' || !child.stderr || typeof child.stderr.on !== 'function') {
      resolveResult({ code: 1, output: 'Invalid child process interface\n' });
      return;
    }
    let settled = false;
    let cancelTimeout = () => {};
    let processError = '';
    let timingOutput = '';
    const timingDecoder = createTimingDecoder(captureTiming);
    const finish = (code, errorMessage) => {
      if (settled) return;
      settled = true;
      cancelTimeout();
      if (timingDecoder) timingOutput += timingDecoder.flush();
      const output = capture.finish();
      const duplicate = errorMessage && output.includes(errorMessage.trim());
      resolveResult({ code, output: `${output}${duplicate ? '' : errorMessage}`, ...(captureTiming ? { timingOutput } : {}) });
    };
    try {
      child.stdout.on('data', (chunk) => {
        capture.capture('stdout')(chunk);
        if (captureTiming) timingOutput += timingDecoder.decode(chunk);
      });
      child.stderr.on('data', capture.capture('stderr'));
      child.on('error', (error) => {
        if (!processError) processError = `${error.message}\n`;
        finish(1, processError);
      });
      child.on('close', (code) => {
        finish(processError ? 1 : (Number.isInteger(code) && code >= 0 ? code : 1), processError);
      });
    } catch (error) {
      finish(1, `${error.message}\n`);
      return;
    }
    cancelTimeout = scheduleChildTimeout(child, { timeoutMs, getErrorMessage: () => processError, finish: (message) => finish(1, message) });
  });
}
