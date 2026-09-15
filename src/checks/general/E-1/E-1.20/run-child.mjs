import { spawn } from "node:child_process";
import { appendBoundedOutput } from "./bound-process-output.mjs";
import { handleChildProgress } from "./handle-child-progress.mjs";
import { createProgressTimeout } from "./create-progress-timeout.mjs";

export function runChild(command, args, options = {}) {
  const maxOutputLength = options.maxOutputLength;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    const timeout = createProgressTimeout({
      timeoutMs: options.progressTimeoutMs,
      onTimeout: () => {
        options.onTimeout?.();
        child.kill();
      },
    });
    const resetProgressTimer = timeout.reset;
    timeout.reset();
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      options.onStdout?.(text);
      stdout = appendBoundedOutput(stdout, text, maxOutputLength);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      handleChildProgress(text, { ...options, resetProgressTimer });
      options.onStderr?.(text);
      stderr = appendBoundedOutput(stderr, options.captureStderr?.(text) ?? text, maxOutputLength);
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
