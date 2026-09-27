import { spawn } from "node:child_process";
import { terminateChild } from "./E-0.1.20/terminate-child.mjs";
import { killWindowsProcessTree } from "./E-0.1.20/terminate-windows-process-tree.mjs";
import { createOutdatedDependenciesOutput } from "./create-outdated-dependencies-output.mjs";
import { createOutdatedDependenciesCommand } from "./create-outdated-dependencies-command.mjs";
import { parseOutdatedDependenciesOutput } from "./parse-outdated-dependencies-output.mjs";
import { createOutdatedDependenciesOverflowHandler } from "./create-outdated-dependencies-overflow-handler.mjs";
import { formatOutdatedDependencyError } from "./format-outdated-dependency-error.mjs";

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
    const output = createOutdatedDependenciesOutput(maxStdoutLength, maxStderrLength);
    let oversized = false;
    let settled = false;
    let overflowHandler;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      overflowHandler?.cancel();
      reject(new Error(formatOutdatedDependencyError(error, env)));
    };
    const resolveOnce = (value) => {
      if (settled) return;
      settled = true;
      overflowHandler?.cancel();
      resolve(value);
    };
    let child;
    try {
      const command = createOutdatedDependenciesCommand(root, { env, platform, execPath });
      child = spawnProcess(command.executable, command.args, command.options);
    } catch (error) {
      rejectOnce(error);
      return;
    }
    overflowHandler = createOutdatedDependenciesOverflowHandler({
      child,
      maxOutputLength: maxStdoutLength,
      terminationGracePeriodMs,
      terminateProcess,
      platform,
      killProcess,
      killTree,
      env,
      onGracePeriodExpired: rejectOnce,
    });
    child.stdout.on("data", (chunk) => {
      if (oversized || settled) return;
      if (!output.appendStdout(chunk)) {
        oversized = true;
        overflowHandler.start();
        return;
      }
    });
    child.stderr.on("data", (chunk) => {
      output.appendStderr(chunk);
    });
    child.on("error", rejectOnce);
    child.on("close", (code) => {
      if (oversized)
        return rejectOnce(overflowHandler.createError());
      try {
        resolveOnce(parseOutdatedDependenciesOutput(output.stdout, output.stderr, code, env));
      } catch (error) {
        rejectOnce(error);
      }
    });
  });
}
