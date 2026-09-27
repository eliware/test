import { spawn } from "node:child_process";
import { terminateChild } from "./E-0.1.20/terminate-child.mjs";
import { killWindowsProcessTree } from "./E-0.1.20/terminate-windows-process-tree.mjs";
import { createOutdatedDependenciesCommand } from "./create-outdated-dependencies-command.mjs";
import { parseOutdatedDependenciesOutput } from "./parse-outdated-dependencies-output.mjs";
import { formatOutdatedDependencyError } from "./format-outdated-dependency-error.mjs";
import { collectOutdatedDependenciesProcessOutput } from "./collect-outdated-dependencies-process-output.mjs";

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
  let child;
  try {
    const command = createOutdatedDependenciesCommand(root, { env, platform, execPath });
    child = spawnProcess(command.executable, command.args, command.options);
  } catch (error) {
    return Promise.reject(new Error(formatOutdatedDependencyError(error, env)));
  }
  return collectOutdatedDependenciesProcessOutput(child, {
    maxStdoutLength,
    maxStderrLength,
    terminationGracePeriodMs,
    terminateProcess,
    platform,
    killProcess,
    killTree,
    env,
  })
    .then(({ stdout, stderr, code }) => parseOutdatedDependenciesOutput(stdout, stderr, code, env))
    .catch((error) => {
      throw new Error(formatOutdatedDependencyError(error, env));
    });
}
