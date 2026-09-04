import { spawn as defaultSpawn } from 'node:child_process';
import { childEnvironment } from './environment/child-environment.mjs';
import { createOutputCapture } from './output/capture-output.mjs';

/** Run a child process and return its bounded combined output and exit code. */
export function runChildProcess(command, argumentsList = [], options = {}) {
  if (typeof command !== 'string' || command.length === 0) {
    throw new TypeError('runChildProcess requires a command');
  }
  if (!Array.isArray(argumentsList)) {
    throw new TypeError('runChildProcess arguments must be an array');
  }
  if (options === null || typeof options !== 'object') {
    throw new TypeError('runChildProcess options must be an object');
  }

  return new Promise((resolveResult) => {
    const capture = createOutputCapture();
    let settled = false;
    let processError = '';
    let timeout;
    const finish = (code, errorMessage) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      resolveResult({ code, output: capture.finish(errorMessage) });
    };
    const child = (options.spawn ?? defaultSpawn)(command, argumentsList, {
      cwd: options.cwd,
      env: childEnvironment(options),
      windowsHide: true
    });
    if (Number.isFinite(options.timeoutMs) && options.timeoutMs > 0) {
      timeout = setTimeout(() => {
        processError = `Process timed out after ${options.timeoutMs}ms\n`;
        child.kill();
        finish(1, processError);
      }, options.timeoutMs);
    }
    child.stdout.on('data', capture.capture('stdout'));
    child.stderr.on('data', capture.capture('stderr'));
    child.on('error', (error) => {
      processError = `${error.message}\n`;
      finish(1, processError);
    });
    child.on('close', (code) => finish(processError ? 1 : (Number.isInteger(code) && code >= 0 ? code : 1), processError));
  });
}
