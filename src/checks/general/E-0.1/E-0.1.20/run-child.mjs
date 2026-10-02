import { spawn } from "node:child_process";
import { createChildProgressHandler } from "./handle-child-progress.mjs";
import { createProgressTimeout } from "./create-progress-timeout.mjs";
import { createChildOutputCapture } from "./capture-child-output.mjs";
import { createChildTerminationHandler } from "./create-child-termination-handler.mjs";
import { wireChildOutput } from "./wire-child-output.mjs";
import { createChildProcessErrorHandler } from "./handle-child-process-error.mjs";
import { terminateChildAfterSetupFailure } from "./terminate-child-after-setup-failure.mjs";
import { createChildSpawnOptions } from "./create-child-spawn-options.mjs";
import { createChildCloseHandler } from "./handle-child-close.mjs";

export function runChild(command, args, options = {}) {
  const maxOutputLength = options.maxOutputLength;
  const outputLimit = maxOutputLength ?? 100_000;
  const spawnProcess = options.spawnProcess ?? spawn;
  const createTimeout = options.createProgressTimeout ?? createProgressTimeout;
  const environment = options.env ?? process.env;
  return new Promise((resolve, reject) => {
    const output = createChildOutputCapture(outputLimit, { ...options, env: environment });
    let settled = false;
    let termination;
    let timeout;
    const settleError = createChildProcessErrorHandler({
      isSettled: () => settled,
      markSettled: () => {
        settled = true;
      },
      getTimeout: () => timeout,
      getTermination: () => termination,
      output,
      reject,
    });
    let child;
    try {
      child = spawnProcess(command, args, createChildSpawnOptions(options, environment));
    } catch (error) {
      // codescope ignore: output capture is initialized before spawn, so synchronous launch errors are redacted by the same complete-output adapter as async errors
      settleError(error);
      return;
    }
    try {
      timeout = createTimeout({
        timeoutMs: options.progressTimeoutMs,
        onTimeout: () => termination.onTimeout(),
      });
      termination = createChildTerminationHandler({
        child,
        options,
        environment,
        timeout,
        output,
        resolve,
        isSettled: () => settled,
        markSettled: () => {
          settled = true;
        },
      });
      const resetProgressTimer = () => {
        if (!settled) timeout.reset();
      };
      const progress = createChildProgressHandler({
        ...options,
        resetProgressTimer,
        redactProgressText: output.redactComplete,
      });
      timeout.reset();
      const flushOutput = wireChildOutput(child, output, progress);
      const handleClose = createChildCloseHandler({
        isSettled: () => settled,
        markSettled: () => {
          settled = true;
        },
        flushOutput,
        timeout,
        termination,
        output,
        settleError,
        resolve,
      });
      child.on("error", (error) => {
        settleError(error);
      });
      child.on("close", handleClose);
    } catch (error) {
      terminateChildAfterSetupFailure(child, options, environment);
      settleError(error);
    }
  });
}
