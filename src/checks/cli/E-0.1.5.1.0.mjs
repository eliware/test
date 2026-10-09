import { fail, pass } from "../check-result.mjs";
import { execute } from "../../validation/shared/process/execute-child-process.mjs";
import { collectCliEntrypoints } from "./E-0.1.5.1.0/collect-cli-entrypoints.mjs";
import { runCliInformationCommands } from "./E-0.1.5.1.0/run-cli-information-commands.mjs";
import { validateProfileDocumentation } from "../../validation/shared/conventions/validate-profile-documentation.mjs";

export const ruleId = "E-0.1.5.1.0";

export async function run(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const entrypoints = collectCliEntrypoints(context.packageJson);
  const errors = await validateProfileDocumentation("cli", context.repositoryInventory);
  if (!entrypoints.length) errors.push("CLI repositories must declare a bin entrypoint.");
  if (entrypoints.length) {
    errors.push(
      ...(await runCliInformationCommands({
        root,
        entrypoints,
        packageVersion: context.packageJson?.version,
        executeEntrypoint: dependencies.execute ?? execute,
      })),
    );
  }
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
