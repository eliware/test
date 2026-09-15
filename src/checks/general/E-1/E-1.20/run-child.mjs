import { spawn } from "node:child_process";
import { appendBoundedOutput } from "./bound-process-output.mjs";
import { handleChildProgress } from "./handle-child-progress.mjs";
import { createProgressTimeout } from "./create-progress-timeout.mjs";
import { terminateChild } from "./terminate-child.mjs";

export function runChild(command, args, options = {}) {
  const maxOutputLength = options.maxOutputLength;
  const outputLimit = maxOutputLength ?? 100_000;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      detached: process.platform !== "win32",
    });
    let stdout = "";
    let stderr = "";
    let streamed = 0;
    const stream = (callback, text) => {
      if (!callback || streamed >= outputLimit) return;
      const remaining = outputLimit - streamed;
      const bounded = text.slice(0, remaining);
      streamed += bounded.length;
      callback(bounded);
    };
    const timeout = createProgressTimeout({
      timeoutMs: options.progressTimeoutMs,
      onTimeout: () => {
        options.onTimeout?.();
        terminateChild(child);
      },
    });
    const resetProgressTimer = timeout.reset;
    timeout.reset();
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stream(options.onStdout, text);
      stdout = appendBoundedOutput(stdout, text, Math.max(0, outputLimit - stderr.length));
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      handleChildProgress(text, { ...options, resetProgressTimer });
      stream(options.onStderr, text);
      stderr = appendBoundedOutput(stderr, options.captureStderr?.(text) ?? text, Math.max(0, outputLimit - stdout.length));
    });
    child.on("error", (error) => {
      timeout.stop();
      reject(error);
    });
    child.on("close", (code, signal) => {
      timeout.stop();
      resolve({ code, signal, stdout, stderr, ...(timeout.wasTriggered() ? { timedOut: true } : {}) });
    });
  });
}
