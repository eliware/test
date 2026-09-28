import { fail, pass } from "../../check-result.mjs";
import { findRepositoryFiles } from "./find-repository-files.mjs";
import { findInfrastructureInternalIdentifiers } from "./find-infrastructure-internal-identifiers.mjs";

export const ruleId = "E-0.1.7";
export const parentRuleId = "E-0.1";

export async function run({
  root,
  packageJson,
  files: suppliedFiles,
  repositoryInventory,
  findFiles = findRepositoryFiles,
}) {
  if (packageJson?.private === true) return pass(ruleId);
  try {
    const files =
      suppliedFiles ??
      (repositoryInventory ? await repositoryInventory.repositoryFiles() : await findFiles(root));
    const findings = await findInfrastructureInternalIdentifiers(root, files, {
      readBytes: repositoryInventory ? (path) => repositoryInventory.readBytes(path) : undefined,
    });
    if (findings.length > 0) {
      return fail(
        ruleId,
        `Infrastructure-internal identifiers found in public repository files: ${findings.join(", ")}.`,
      );
    }
  } catch (error) {
    return fail(ruleId, `Repository files could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
