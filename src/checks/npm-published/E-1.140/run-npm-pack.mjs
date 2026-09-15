import { buildPackArguments } from "./build-pack-arguments.mjs";
import { resolvePackExecutable } from "./resolve-pack-executable.mjs";

export async function runNpmPack(root, run, resolveCommand = resolvePackExecutable) {
  const [command, prefix] = resolveCommand();
  return run(command, [...prefix, ...buildPackArguments()], { cwd: root });
}
