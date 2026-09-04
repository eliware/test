import { createOutputCapture } from './output/capture-output.mjs';
import { assertChildProcessArguments } from './child-validation.mjs';
import { spawnChild } from './spawn-child.mjs';
import { monitorChildProcess } from './monitor-child-process.mjs';

/** Run a child process and return its bounded combined output and exit code. */
export function runChildProcess(command, argumentsList = [], options = {}) {
  assertChildProcessArguments(command, argumentsList, options);

  const capture = createOutputCapture();
    let child;
    try {
      child = spawnChild(command, argumentsList, options);
    } catch (error) {
      return Promise.resolve({ code: 1, output: capture.finish(`${error.message}\n`) });
    }
    return monitorChildProcess(child, capture, options);
}
