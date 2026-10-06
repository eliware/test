import { buildPackArguments } from "./build-pack-arguments.mjs";
import { resolvePackExecutable } from "./resolve-pack-executable.mjs";

export async function runNpmPack(
  root,
  run,
  resolveCommand = resolvePackExecutable,
  extraArgs = [],
  env = process.env,
) {
  const argumentsList = buildPackArguments(extraArgs);
  const [command, prefix] = resolveCommand(env, process.platform, process.execPath, root);
  return run(command, [...prefix, ...argumentsList], { cwd: root, env: { ...env } });
}
