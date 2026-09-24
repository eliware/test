import { spawn } from "node:child_process";
import { collectRedactionSecrets, redactProcessOutput } from "./redact-process-output.mjs";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const child = spawnProcess(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    const redactionSecrets = collectRedactionSecrets(options?.env);
    let stdout = "";
    let stderr = "";
    let captured = 0;
    let capturedRawBytes = 0;
    const append = (current, chunk) => {
      const rawChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      const rawRemaining = Math.max(0, MAX_OUTPUT_LENGTH - capturedRawBytes);
      if (rawRemaining === 0) return current;
      const boundedRawChunk = rawChunk.subarray(0, rawRemaining);
      capturedRawBytes += boundedRawChunk.length;
      const remaining = Math.max(0, MAX_OUTPUT_LENGTH - captured);
      if (remaining === 0) return current;
      const value = redactProcessOutput(boundedRawChunk.toString(), redactionSecrets).slice(0, remaining);
      captured += value.length;
      return `${current}${value}`;
    };
    child.stdout?.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr?.on("data", (chunk) => { stderr = append(stderr, chunk); });
    let settled = false;
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      resolveResult({ code, signal, stdout, stderr });
    });
  });
}
