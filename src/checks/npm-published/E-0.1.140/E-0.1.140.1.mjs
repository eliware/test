import { fail, pass } from "../../check-result.mjs";
import { runNpmPack } from "./run-npm-pack.mjs";
import { executePackValidation } from "./execute-pack-validation.mjs";
import { validatePublicationMetadata } from "./validate-publication-metadata.mjs";

export const ruleId = "E-0.1.140.1";
export const parentRuleId = "E-0.1.140";

export async function run({
  packageJson,
  root,
  executePack = false,
  mode = null,
  runPack = runNpmPack,
  toolArgs = [],
}) {
  const metadataError = validatePublicationMetadata(packageJson, {
    selfHosted: packageJson?.name === "@eliware/test",
  });
  if (metadataError) return fail(ruleId, metadataError);
  const executionError = await executePackValidation({
    root,
    packageJson,
    executePack,
    mode,
    runPack,
    toolArgs,
  });
  return executionError ? fail(ruleId, executionError) : pass(ruleId);
}
