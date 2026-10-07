import { spawn } from "node:child_process";
import { createChildProcessOutputCapture } from "./create-child-process-output-capture.mjs";
import { redactChildProcessError } from "../output/redaction/redact-child-process-error.mjs";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options = {}, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const { redactionSecrets: suppliedSecrets = [], ...childOptions } = options ?? {};
    const output = createChildProcessOutputCapture(
      childOptions,
      suppliedSecrets,
      MAX_OUTPUT_LENGTH,
    );
    let settled = false;
    let child;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(redactChildProcessError(error, output, output.finish()));
    };
    try {
      // Captured pipes are required for bounded output collection and secret redaction; shell use is prohibited.
      child = spawnProcess(command, args, {
        ...childOptions,
        env: { ...(childOptions.env ?? process.env) },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
      if (!child || typeof child.on !== "function") {
        throw new TypeError("Child process adapter returned an invalid child process.");
      }
      child.on("error", (error) => {
        terminateChild(child);
        rejectOnce(error);
      });
      attachOutputStream(child, child.stdout, "stdout", output, rejectOnce, () => settled);
      attachOutputStream(child, child.stderr, "stderr", output, rejectOnce, () => settled);
      child.on("close", (code, signal) => {
        if (settled) return;
        if (signal != null) {
          rejectOnce(new Error(`Child process terminated by signal ${signal}.`));
          return;
        }
        if (code === null) {
          rejectOnce(new Error("Child process exited without an exit code."));
          return;
        }
        settled = true;
        resolveResult({ code, signal, ...output.finish() });
      });
    } catch (error) {
      terminateChild(child);
      rejectOnce(error);
    }
  });
}

function terminateChild(child) {
  if (typeof child?.kill !== "function") return;
  try {
    child.kill();
  } catch {
    // Preserve the stream setup error as the actionable failure.
  }
}

function attachOutputStream(child, stream, name, output, rejectOnce, isSettled) {
  if (stream == null) return;
  if (typeof stream.on !== "function") {
    throw new TypeError(`Child process adapter returned an invalid ${name} stream.`);
  }
  stream.on("data", (chunk) => {
    if (!isSettled()) output.push(name, chunk);
  });
  stream.on("error", (error) => {
    terminateChild(child);
    rejectOnce(error);
  });
}
