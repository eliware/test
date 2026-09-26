import { spawn } from "node:child_process";
import { createChildProgressHandler } from "./handle-child-progress.mjs";
import { createProgressTimeout } from "./create-progress-timeout.mjs";
import { createChildOutputCapture } from "./capture-child-output.mjs";
import { createChildTerminationHandler } from "./create-child-termination-handler.mjs";

export function runChild(command, args, options = {}) {
  const maxOutputLength = options.maxOutputLength;
  const outputLimit = maxOutputLength ?? 100_000;
  const spawnProcess = options.spawnProcess ?? spawn;
  const createTimeout = options.createProgressTimeout ?? createProgressTimeout;
  const environment = options.env ?? process.env;
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, {
      cwd: options.cwd,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      detached: process.platform !== "win32",
    });
    const output = createChildOutputCapture(outputLimit, { ...options, env: environment });
    let settled = false;
    let termination;
    const settleError = (error) => {
      if (settled) return;
      settled = true;
      timeout.stop();
      termination?.cancel();
      reject(error);
    };
    const timeout = createTimeout({
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
      markSettled: () => { settled = true; },
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
    child.stdout.on("data", (chunk) => {
      output.stdout(chunk);
    });
    child.stderr.on("data", (chunk) => {
      progress.push(chunk);
      output.stderr(chunk);
    });
    child.on("error", (error) => {
      settleError(error);
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      output.flush();
      progress.flush();
      timeout.stop();
      termination.cancel();
      resolve({
        code,
        signal,
        ...output.result(),
        ...(termination.wasTimedOut()
          ? { timedOut: true, terminationRequested: true, terminationConfirmed: true }
          : {}),
      });
    });
  });
}
