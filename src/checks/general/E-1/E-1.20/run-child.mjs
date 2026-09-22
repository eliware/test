import { spawn } from "node:child_process";
import { handleChildProgress } from "./handle-child-progress.mjs";
import { createProgressTimeout } from "./create-progress-timeout.mjs";
import { terminateChild } from "./terminate-child.mjs";
import { createChildOutputCapture } from "./capture-child-output.mjs";

export function runChild(command, args, options = {}) {
  const maxOutputLength = options.maxOutputLength;
  const outputLimit = maxOutputLength ?? 100_000;
  const spawnProcess = options.spawnProcess ?? spawn;
  const createTimeout = options.createProgressTimeout ?? createProgressTimeout;
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      detached: process.platform !== "win32",
    });
    const output = createChildOutputCapture(outputLimit, options);
    let settled = false;
    let timedOut = false;
    const settleError = (error) => {
      if (settled) return;
      settled = true;
      timeout.stop();
      reject(error);
    };
    const timeout = createTimeout({
      timeoutMs: options.progressTimeoutMs,
      onTimeout: () => {
        if (settled) return;
        timeout.stop();
      timedOut = true;
      options.onTimeout?.();
        terminateChild(child);
      },
    });
    const resetProgressTimer = timeout.reset;
    timeout.reset();
    child.stdout.on("data", (chunk) => {
      output.stdout(chunk.toString());
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      handleChildProgress(text, { ...options, resetProgressTimer });
      output.stderr(text);
    });
    child.on("error", (error) => {
      settleError(error);
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      timeout.stop();
      resolve({ code, signal, ...output.result(), ...(timedOut || timeout.wasTriggered() ? { timedOut: true } : {}) });
    });
  });
}
