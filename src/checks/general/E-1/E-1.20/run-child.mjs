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
    const redact = (text) => text
      .replace(/((?:password|passwd|pwd|token|secret|api[_-]?key|access[_-]?key|private[_-]?key)\s*[=:]\s*)(["']?)[^\s,;"']+\2/giu, "$1[REDACTED]")
      .replace(/(authorization\s*:\s*(?:bearer|basic)\s+)[^\s,;]+/giu, "$1[REDACTED]")
      .replace(/((?:Bearer|Basic)\s+)[A-Za-z0-9+/=_-]{12,}/gu, "$1[REDACTED]");
    const stream = (callback, text) => {
      if (!callback || streamed >= outputLimit) return;
      const remaining = outputLimit - streamed;
      const bounded = redact(text).slice(0, remaining);
      streamed += bounded.length;
      callback(bounded);
    };
    const settleError = (error) => {
      timeout.stop();
      reject(error);
    };
    const timeout = createProgressTimeout({
      timeoutMs: options.progressTimeoutMs,
      onTimeout: () => {
        timeout.stop();
        options.onTimeout?.();
        terminateChild(child);
      },
    });
    const resetProgressTimer = timeout.reset;
    timeout.reset();
    let capturedLength = 0;
    const capture = (chunks, text) => {
      const remaining = Math.max(0, outputLimit - capturedLength);
      const bounded = text.length > remaining && remaining > 0
        ? `${text.slice(0, remaining - 1)}…`.slice(0, remaining)
        : text.slice(0, remaining);
      if (bounded) chunks.push(bounded);
      capturedLength += bounded.length;
      return bounded.length;
    };
    child.stdout.on("data", (chunk) => {
      const text = redact(chunk.toString());
      stream(options.onStdout, text);
      stdoutLength += capture(stdoutChunks, text);
    });
    child.stderr.on("data", (chunk) => {
      const text = redact(chunk.toString());
      handleChildProgress(text, { ...options, resetProgressTimer });
      stream(options.onStderr, text);
      stderrLength += capture(stderrChunks, options.captureStderr?.(text) ?? text);
    });
    child.on("error", (error) => {
      settleError(error);
    });
    child.on("close", (code, signal) => {
      timeout.stop();
      resolve({ code, signal, stdout: stdoutChunks.join(""), stderr: stderrChunks.join(""), ...(timeout.wasTriggered() ? { timedOut: true } : {}) });
    });
  });
}
