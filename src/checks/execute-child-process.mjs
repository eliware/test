import { spawn } from "node:child_process";
import { createChildProcessOutputCapture } from "./create-child-process-output-capture.mjs";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options = {}, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const { redactionSecrets: suppliedSecrets = [], ...childOptions } = options ?? {};
    const output = createChildProcessOutputCapture(childOptions, suppliedSecrets, MAX_OUTPUT_LENGTH);
    let child;
    try {
      child = spawnProcess(command, args, { ...childOptions, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      reject(redactSpawnError(error, output));
      return;
    }
    child.stdout?.on("data", (chunk) => output.push("stdout", chunk));
    child.stderr?.on("data", (chunk) => output.push("stderr", chunk));
    let settled = false;
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(redactSpawnError(error, output));
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      resolveResult({ code, signal, ...output.finish() });
    });
  });
}

function redactSpawnError(error, output) {
  const safeError = new Error(output.redactDiagnostic(error?.message ?? String(error)));
  safeError.name = typeof error?.name === "string" ? error.name : "Error";
  if (typeof error?.code === "string") safeError.code = error.code;
  return safeError;
}
