import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { runNpmPack } from "./run-npm-pack.mjs";
import { executePackValidation } from "./execute-pack-validation.mjs";
import { validatePublicationMetadata } from "./validate-publication-metadata.mjs";
import { findNpmignoreFiles } from "./find-npmignore-files.mjs";
import { validateEnvExampleContent } from "./validate-env-example-content.mjs";

export const ruleId = "E-0.1.140.1";
export const parentRuleId = "E-0.1.140";

export async function run({
  packageJson,
  root,
  repositoryInventory,
  executePack = false,
  mode = null,
  runPack = runNpmPack,
  toolArgs = [],
}) {
  const metadataError = validatePublicationMetadata(packageJson, {
    selfHosted: packageJson?.name === "@eliware/test",
  });
  if (metadataError) return fail(ruleId, metadataError);
  const files = repositoryInventory?.files ? await repositoryInventory.files("all") : [];
  const npmignoreFiles = findNpmignoreFiles(files);
  if (npmignoreFiles.length)
    return fail(
      ruleId,
      `Public npm repositories must not contain .npmignore files: ${npmignoreFiles.join(", ")}.`,
    );
  if (packageJson?.files?.includes(".env.example")) {
    try {
      const content = await readFile(join(root, ".env.example"), "utf8");
      const templateError = validateEnvExampleContent(content);
      if (templateError) return fail(ruleId, templateError);
    } catch {
      return fail(ruleId, "package.json.files includes .env.example but the file is missing.");
    }
  }
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
