import { spawn } from "node:child_process";
import { terminateChild } from "./E-0.1.20/terminate-child.mjs";
import { killWindowsProcessTree } from "./E-0.1.20/terminate-windows-process-tree.mjs";
import { createOutdatedDependenciesOutput } from "./create-outdated-dependencies-output.mjs";
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
    const output = createOutdatedDependenciesOutput(maxStdoutLength, maxStderrLength);
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
      if (!output.appendStdout(chunk)) {
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
    });
    child.stderr.on("data", (chunk) => {
      output.appendStderr(chunk);
    });
    child.on("error", rejectOnce);
    child.on("close", (code) => {
      if (oversized)
        return rejectOnce(new Error(`npm outdated output exceeded ${maxStdoutLength} characters.`));
      try {
        resolveOnce(parseOutdatedDependenciesOutput(output.stdout, output.stderr, code, env));
      } catch (error) {
        rejectOnce(error);
      }
    });
  });
}
