import { spawn } from "node:child_process";
import { buildPrettierArguments } from "./build-prettier-arguments.mjs";
import { execute } from "./execute-child-process.mjs";
import { resolvePrettierExecutable } from "./resolve-prettier-executable.mjs";

export async function runPrettier(
  root,
  { write = false } = {},
  run,
  resolveExecutable = resolvePrettierExecutable,
  spawnProcess = spawn,
) {
  const executable = await resolveExecutable();
  const executePrettier = run ?? ((...args) => execute(...args, spawnProcess));
  return executePrettier(process.execPath, [executable, ...buildPrettierArguments({ write })], {
    cwd: root,
  });
}
