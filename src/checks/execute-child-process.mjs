import { spawn } from "node:child_process";
import { redactProcessOutput } from "./redact-process-output.mjs";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const child = spawnProcess(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let captured = 0;
    const append = (current, chunk) => {
      const remaining = Math.max(0, MAX_OUTPUT_LENGTH - captured);
      if (remaining === 0) return current;
      const value = redactProcessOutput(chunk).slice(0, remaining);
      captured += value.length;
      return `${current}${value}`;
    };
    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
    child.on("error", reject);
    child.on("close", (code, signal) => resolveResult({ code, signal, stdout, stderr }));
  });
}
