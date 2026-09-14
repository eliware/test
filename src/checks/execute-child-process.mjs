import { spawn } from "node:child_process";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const child = spawnProcess(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout = `${stdout}${chunk.toString()}`.slice(0, MAX_OUTPUT_LENGTH); });
    child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk.toString()}`.slice(0, MAX_OUTPUT_LENGTH); });
    child.on("error", reject);
    child.on("close", (code, signal) => resolveResult({ code, signal, stdout, stderr }));
  });
}
