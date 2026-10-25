import { spawn } from "node:child_process";
import { attachChildProcessOutput, terminateChildProcess } from "./attach-child-process-output.mjs";
import { createChildProcessOutputCapture } from "./create/child/process-output-capture.mjs";
import { redactChildProcessError } from "../output/redaction/redact/child-process-error.mjs";

const MAX_OUTPUT_LENGTH = 100_000;

export function execute(command, args, options = {}, spawnProcess = spawn) {
  return new Promise((resolveResult, reject) => {
    const {
      maxOutputLength = MAX_OUTPUT_LENGTH,
      redactionSecrets: suppliedSecrets = [],
      ...childOptions
    } = options ?? {};
    const output = createChildProcessOutputCapture(childOptions, suppliedSecrets, maxOutputLength);
    let settled = false;
    let child;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(redactChildProcessError(error, output, output.finish()));
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
      child.on("error", (error) => {
        terminateChildProcess(child);
        rejectOnce(error);
      });
      attachChildProcessOutput(child, child.stdout, "stdout", output, rejectOnce, () => settled);
      attachChildProcessOutput(child, child.stderr, "stderr", output, rejectOnce, () => settled);
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
      terminateChildProcess(child);
      rejectOnce(error);
    }
  });
}
