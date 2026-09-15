import { spawn } from "node:child_process";
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
    const stdoutChunks = [];
    const stderrChunks = [];
    let stdoutLength = 0;
    let stderrLength = 0;
    let streamed = 0;
    const stream = (callback, text) => {
      if (!callback || streamed >= outputLimit) return;
      const remaining = outputLimit - streamed;
      const bounded = text.slice(0, remaining);
      streamed += bounded.length;
      callback(bounded);
    };
    let timeoutTriggered = false;
    const timeout = createProgressTimeout({
      timeoutMs: options.progressTimeoutMs,
      onTimeout: () => {
        if (timeoutTriggered) return;
        timeoutTriggered = true;
        timeout.stop();
        options.onTimeout?.();
        terminateChild(child);
      },
    });
    const resetProgressTimer = timeout.reset;
    timeout.reset();
    const capture = (chunks, length, text, otherLength) => {
      const remaining = Math.max(0, outputLimit - otherLength - length);
      const bounded = text.length > remaining && remaining > 0
        ? `${text.slice(0, remaining - 1)}…`.slice(0, remaining)
        : text.slice(0, remaining);
      if (bounded) chunks.push(bounded);
      return length + bounded.length;
    };
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stream(options.onStdout, text);
      stdoutLength = capture(stdoutChunks, stdoutLength, text, stderrLength);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      handleChildProgress(text, { ...options, resetProgressTimer });
      stream(options.onStderr, text);
      stderrLength = capture(stderrChunks, stderrLength, options.captureStderr?.(text) ?? text, stdoutLength);
    });
    child.on("error", (error) => {
      timeout.stop();
      reject(error);
    });
    child.on("close", (code, signal) => {
      timeout.stop();
      resolve({ code, signal, stdout: stdoutChunks.join(""), stderr: stderrChunks.join(""), ...(timeout.wasTriggered() ? { timedOut: true } : {}) });
    });
  });
}
