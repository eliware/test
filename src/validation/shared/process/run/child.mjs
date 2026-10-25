import { spawn } from "node:child_process";
import { createProgressTimeout } from "../../../stages/jest/progress/create/progress-timeout.mjs";
import { createChildOutputCapture } from "../capture-child-output.mjs";
import { createChildProcessErrorHandler } from "../handle-child/process-error.mjs";
import { terminateChildAfterSetupFailure } from "../terminate/child-after-setup-failure.mjs";
import { createChildSpawnOptions } from "../create/child/spawn-options.mjs";
import { createChildTimeoutController } from "../create/child/timeout-controller.mjs";
import { resolveChildOutputLimit } from "../resolve-child-output-limit.mjs";
import { registerChildLifecycle } from "./lifecycle.mjs";
export function runChild(command, args, options = {}) {
  const outputLimit = resolveChildOutputLimit(options.maxOutputLength ?? 100_000);
  const spawnProcess = options.spawnProcess ?? spawn;
  const createTimeout = options.createProgressTimeout ?? createProgressTimeout;
  const environment = { ...(options.env ?? process.env) };
  return new Promise((resolve, reject) => {
    const output = createChildOutputCapture(outputLimit, { ...options, env: environment });
    let settled = false;
    let termination;
    const timeoutController = createChildTimeoutController(
      options,
      createTimeout,
      () => termination,
    );
    const timeout = timeoutController.timeout;
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
      settleError(error);
      return;
    }
    try {
      termination = registerChildLifecycle(child, {
        options,
        environment,
        timeout,
        timeoutController,
        output,
        resolve,
        isSettled: () => settled,
        markSettled: () => {
          settled = true;
        },
        settleError,
        setTermination: (handler) => {
          termination = handler;
        },
      });
    } catch (error) {
      terminateChildAfterSetupFailure(child, options, environment);
      settleError(error);
    }
  });
}
