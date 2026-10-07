import { spawn } from "node:child_process";
import { buildPrettierArguments } from "./build-prettier-arguments.mjs";
import { execute } from "../../shared/process/execute-child-process.mjs";
import { resolvePrettierExecutable } from "./resolve-prettier-executable.mjs";

export async function runPrettier(
  root,
  { write = false, extraArgs = [], paths = [], env = process.env } = {},
  run,
  resolveExecutable = resolvePrettierExecutable,
  spawnProcess = spawn,
) {
  const executable = await resolveExecutable();
  const executePrettier = run ?? ((...args) => execute(...args, spawnProcess));
  return executePrettier(
    process.execPath,
    [executable, ...buildPrettierArguments({ write, extraArgs, paths })],
    {
      cwd: root,
      env,
    },
  );
}
