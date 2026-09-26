import { spawn } from "node:child_process";
import { handleChildProgress } from "./handle-child-progress.mjs";
import { createProgressTimeout } from "./create-progress-timeout.mjs";
import { terminateChild } from "./terminate-child.mjs";
import { createChildOutputCapture } from "./capture-child-output.mjs";
import { scheduleChildTermination } from "./schedule-child-termination.mjs";

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
    let timedOut = false;
    let cancelChildTermination;
    const settleError = (error) => {
      if (settled) return;
      settled = true;
      timeout.stop();
      cancelChildTermination?.();
      reject(error);
    };
    const timeout = createTimeout({
      timeoutMs: options.progressTimeoutMs,
      onTimeout: () => {
        if (settled) return;
        timeout.stop();
        timedOut = true;
        options.onTimeout?.();
        cancelChildTermination = scheduleChildTermination(
          child,
          {
            terminateChild: options.terminateChild ?? terminateChild,
            platform: options.terminationPlatform ?? process.platform,
            killProcess: options.killProcess ?? process.kill,
            killTree: options.killTree,
            environment,
            terminationGraceMs: options.terminationGraceMs ?? 1000,
            forceKillConfirmationMs: options.forceKillConfirmationMs ?? 1000,
          },
          () => {
            if (settled) return;
            settled = true;
            timeout.stop();
            resolve({
              code: null,
              signal: "SIGKILL",
              ...output.result(),
              timedOut: true,
              terminationRequested: true,
              terminationConfirmed: false,
            });
          },
        );
      },
    });
    const resetProgressTimer = timeout.reset;
    timeout.reset();
    child.stdout.on("data", (chunk) => {
      output.stdout(chunk.toString());
    });
    child.stderr.on("data", (chunk) => {
      const text = output.redact(chunk.toString());
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
      cancelChildTermination?.();
      resolve({
        code,
        signal,
        ...output.result(),
        ...(timedOut
          ? { timedOut: true, terminationRequested: true, terminationConfirmed: true }
          : {}),
      });
    });
  });
}
