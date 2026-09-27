import { spawn } from "node:child_process";
import { killWindowsProcessTree, terminateChild } from "./E-0.1.20/terminate-child.mjs";
import { appendBoundedOutputTail } from "./append-bounded-output-tail.mjs";
import { createOutdatedDependenciesCommand } from "./create-outdated-dependencies-command.mjs";
import { parseOutdatedDependenciesOutput } from "./parse-outdated-dependencies-output.mjs";

const maxStdoutLength = 100_000;
const maxStderrLength = 4_000;

export function readOutdatedDependencies(
  root,
  spawnProcess = spawn,
  {
    terminationGracePeriodMs = 1_000,
    env = process.env,
    platform = process.platform,
    execPath = process.execPath,
    terminateProcess = terminateChild,
    killProcess = process.kill,
    killTree = killWindowsProcessTree,
  } = {},
) {
  return new Promise((resolve, reject) => {
    const command = createOutdatedDependenciesCommand(root, { env, platform, execPath });
    const child = spawnProcess(command.executable, command.args, command.options);
    let stdout = "";
    let stderr = "";
    let oversized = false;
    let settled = false;
    let terminationTimer;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(terminationTimer);
      reject(error);
    };
    const resolveOnce = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(terminationTimer);
      resolve(value);
    };
    child.stdout.on("data", (chunk) => {
      if (oversized || settled) return;
      const text = chunk.toString();
      if (stdout.length + text.length > maxStdoutLength) {
        oversized = true;
        try {
          terminateProcess(child, platform, killProcess, killTree, env, "SIGTERM");
        } catch {}
        terminationTimer = setTimeout(() => {
          try {
            terminateProcess(child, platform, killProcess, killTree, env, "SIGKILL");
          } catch {}
          rejectOnce(new Error(`npm outdated output exceeded ${maxStdoutLength} characters.`));
        }, terminationGracePeriodMs);
        return;
      }
      stdout += text;
    });
    child.stderr.on("data", (chunk) => {
      stderr = appendBoundedOutputTail(stderr, chunk, maxStderrLength);
    });
    child.on("error", rejectOnce);
    child.on("close", (code) => {
      if (oversized)
        return rejectOnce(new Error(`npm outdated output exceeded ${maxStdoutLength} characters.`));
      try {
        resolveOnce(parseOutdatedDependenciesOutput(stdout, stderr, code, env));
      } catch (error) {
        rejectOnce(error);
      }
    });
  });
}
