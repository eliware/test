import { fail, pass } from "../../../check-result.mjs";
import { isForbiddenPath } from "./sensitive-path-classifier.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { readSensitiveExemptions } from "./read-sensitive-exemptions.mjs";

export const ruleId = "E-0.1.6.0";
export const parentRuleId = "E-0.1.6";

export async function run(
  { root, packageJson, repositoryInventory, files: suppliedFiles },
  findFiles = findRepositoryFiles,
) {
  const findings = [];
  const allowed = readSensitiveExemptions(packageJson, ruleId);
  try {
    const files =
      suppliedFiles ??
      (repositoryInventory ? await repositoryInventory.repositoryFiles() : await findFiles(root));
    const forbidden = files.filter((path) => isForbiddenPath(path) && !allowed.has(path));
    findings.push(...forbidden);
  } catch {
    return fail(
      ruleId,
      "Repository contents could not be inspected for secret or runtime-state artifacts.",
    );
  }
  if (findings.length > 0)
    return fail(
      ruleId,
      `Unauthorized secret or runtime-state paths found: ${findings.join(", ")}.`,
    );
  return pass(ruleId);
}
