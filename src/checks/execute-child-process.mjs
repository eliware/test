import { spawn } from "node:child_process";
import { createChildProcessOutputCapture } from "./create-child-process-output-capture.mjs";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options = {}, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const { redactionSecrets: suppliedSecrets = [], ...childOptions } = options ?? {};
    const child = spawnProcess(command, args, { ...childOptions, stdio: ["ignore", "pipe", "pipe"] });
    const output = createChildProcessOutputCapture(childOptions, suppliedSecrets, MAX_OUTPUT_LENGTH);
    child.stdout?.on("data", (chunk) => output.push("stdout", chunk));
    child.stderr?.on("data", (chunk) => output.push("stderr", chunk));
    let settled = false;
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      resolveResult({ code, signal, ...output.finish() });
    });
  });
}
