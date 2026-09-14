import { fail, pass } from "../../check-result.mjs";
import { runNpmPack } from "./run-npm-pack.mjs";
import { executePackValidation } from "./execute-pack-validation.mjs";
import { validatePublicationMetadata } from "./validate-publication-metadata.mjs";

export const ruleId = "E-1.140.1";
export const parentRuleId = "E-1.140";

export async function run({
  packageJson,
  root,
  executePack = false,
  mode = null,
  runPack = runNpmPack,
}) {
  const metadataError = validatePublicationMetadata(packageJson);
  if (metadataError) return fail(ruleId, metadataError);
  const executionError = await executePackValidation({ root, executePack, mode, runPack });
  return executionError ? fail(ruleId, executionError) : pass(ruleId);
}
