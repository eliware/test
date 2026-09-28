import { spawn } from "node:child_process";
import { createChildProcessOutputCapture } from "./create-child-process-output-capture.mjs";

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
      reject(redactSpawnError(error, output));
    };
    try {
      child = spawnProcess(command, args, {
        ...childOptions,
        env: { ...(childOptions.env ?? process.env) },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
      if (!child || typeof child.on !== "function") {
        throw new TypeError("Child process adapter returned an invalid child process.");
      }
      child.on("error", rejectOnce);
      attachOutputStream(child.stdout, "stdout", output);
      attachOutputStream(child.stderr, "stderr", output);
      child.on("close", (code, signal) => {
        if (settled) return;
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

function attachOutputStream(stream, name, output) {
  if (stream == null) return;
  if (typeof stream.on !== "function") {
    throw new TypeError(`Child process adapter returned an invalid ${name} stream.`);
  }
  stream.on("data", (chunk) => output.push(name, chunk));
}

function redactSpawnError(error, output) {
  const safeError = new Error(output.redactDiagnostic(error?.message ?? String(error)));
  safeError.name = typeof error?.name === "string" ? error.name : "Error";
  if (typeof error?.code === "string") safeError.code = error.code;
  return safeError;
}
