import { spawn } from "node:child_process";
import { collectRedactionSecrets } from "./collect-redaction-secrets.mjs";
import { createRedactedTextStream } from "./create-redacted-text-stream.mjs";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const child = spawnProcess(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    const redactionSecrets = collectRedactionSecrets(options?.env);
    const stdoutCapture = createRedactedTextStream(redactionSecrets, MAX_OUTPUT_LENGTH);
    const stderrCapture = createRedactedTextStream(redactionSecrets, MAX_OUTPUT_LENGTH);
    let captured = 0;
    let stdout = "";
    let stderr = "";
    const append = (stream, text) => {
      const remaining = Math.max(0, MAX_OUTPUT_LENGTH - captured);
      const bounded = text.slice(0, remaining);
      captured += bounded.length;
      if (stream === "stdout") stdout += bounded;
      else stderr += bounded;
    };
    const capture = (stream, redactor, chunk) => {
      if (captured >= MAX_OUTPUT_LENGTH) return;
      append(stream, redactor.push(chunk));
    };
    child.stdout?.on("data", (chunk) => capture("stdout", stdoutCapture, chunk));
    child.stderr?.on("data", (chunk) => capture("stderr", stderrCapture, chunk));
    let settled = false;
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      if (captured < MAX_OUTPUT_LENGTH) {
        append("stdout", stdoutCapture.finish());
        append("stderr", stderrCapture.finish());
      }
      resolveResult({ code, signal, stdout, stderr });
    });
  });
}
