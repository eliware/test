import { execute } from "../../execute-child-process.mjs";
import { fail, pass } from "../../check-result.mjs";
import { readCliEntrypointSurface } from "./read-cli-entrypoint-surface.mjs";
import { executeCliInformationCommands } from "./execute-cli-information-commands.mjs";

export const ruleId = "E-0.1.60.1";
export const parentRuleId = "E-0.1.60";

export async function run(context) {
  const { root, packageJson, executeEntrypoint = execute } = context;
  const surface = await readCliEntrypointSurface(context);
  const errors = [...surface.errors];
  if (surface.entrypoints.length > 0) {
    const commandError = await executeCliInformationCommands({
      root,
      entrypoints: surface.entrypoints,
      packageVersion: packageJson?.version,
      executeEntrypoint,
    });
    if (commandError) errors.push(commandError);
  }
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
