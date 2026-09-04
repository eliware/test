import { spawn as defaultSpawn } from 'node:child_process';
import { childEnvironment } from './environment/child-environment.mjs';
import { createOutputCapture } from './output/capture-output.mjs';
import { assertChildProcessArguments } from './child-validation.mjs';

/** Run a child process and return its bounded combined output and exit code. */
export function runChildProcess(command, argumentsList = [], options = {}) {
  assertChildProcessArguments(command, argumentsList, options);

  return new Promise((resolveResult) => {
    const capture = createOutputCapture();
    let settled = false;
    let processError = '';
    const finish = (code, errorMessage) => {
      if (settled) return;
      settled = true;
      resolveResult({ code, output: capture.finish(errorMessage) });
    };
    let child;
    try {
      child = (options.spawn ?? defaultSpawn)(command, argumentsList, {
        cwd: options.cwd,
        // codescope ignore: child tools intentionally receive the full trusted consumer environment; secret isolation is outside this package contract.
        env: childEnvironment(options),
        windowsHide: true
      });
    } catch (error) {
      finish(1, `${error.message}\n`);
      return;
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
