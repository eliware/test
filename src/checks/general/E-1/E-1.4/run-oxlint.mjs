import { execute } from "../../../execute-child-process.mjs";
import { buildOxlintArguments } from "./build-oxlint-arguments.mjs";
import { resolveOxlintExecutable } from "./resolve-oxlint-executable.mjs";

export async function runOxlint(root, run = execute, resolveExecutable = resolveOxlintExecutable) {
  const executable = await resolveExecutable();
  return run(process.execPath, [executable, ...buildOxlintArguments()], { cwd: root });
}
