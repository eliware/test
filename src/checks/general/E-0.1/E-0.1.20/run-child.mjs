import { spawn } from "node:child_process";
import { createChildProgressHandler } from "./handle-child-progress.mjs";
import { createProgressTimeout } from "./create-progress-timeout.mjs";
import { createChildOutputCapture } from "./capture-child-output.mjs";
import { createChildTerminationHandler } from "./create-child-termination-handler.mjs";
import { wireChildOutput } from "./wire-child-output.mjs";

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
    const settleError = (error) => {
      if (settled) return;
      settled = true;
      timeout?.stop();
      termination?.cancel();
      const diagnostic = output.redactComplete(
        error instanceof Error ? error.message : String(error),
      );
      reject(new Error(diagnostic || "Child process could not be started."));
    };
    let child;
    try {
      child = spawnProcess(command, args, {
        cwd: options.cwd,
        env: environment,
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        detached: (options.terminationPlatform ?? process.platform) !== "win32",
      });
    } catch (error) {
      settleError(error);
      return;
    }
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
    child.on("error", (error) => {
      settleError(error);
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      flushOutput();
      timeout.stop();
      termination.cancel();
      if (code === null && !termination.wasTimedOut()) {
        settleError(
          new Error(`Child process exited without an exit code${signal ? ` (${signal})` : ""}.`),
        );
        return;
      }
      settled = true;
      resolve({
        code,
        signal,
        ...output.result(),
        ...(termination.wasTimedOut()
          ? {
              timedOut: true,
              terminationRequested: true,
              terminationConfirmed: termination.terminationConfirmed(),
            }
          : {}),
      });
    });
  });
}
