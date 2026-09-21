import { buildPackArguments } from "./build-pack-arguments.mjs";
import { resolvePackExecutable } from "./resolve-pack-executable.mjs";

export async function runNpmPack(
  root,
  run,
  resolveCommand = resolvePackExecutable,
  extraArgs = [],
) {
  const [command, prefix] = resolveCommand();
  return run(command, [...prefix, ...buildPackArguments(extraArgs)], { cwd: root });
}
