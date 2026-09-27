import { fail, pass } from "../../check-result.mjs";
import { readTrackedPaths } from "./E-0.1.6/read-tracked-paths.mjs";
import { findInfrastructureInternalIdentifiers } from "./find-infrastructure-internal-identifiers.mjs";

export const ruleId = "E-0.1.7";
export const parentRuleId = "E-0.1";

export async function run({
  root,
  packageJson,
  files: suppliedFiles,
  repositoryInventory,
  readTracked = readTrackedPaths,
}) {
  if (packageJson?.private === true) return pass(ruleId);
  try {
    const files = suppliedFiles ?? (await readTracked(root));
    if (!Array.isArray(files)) {
      return fail(
        ruleId,
        "Git tracked-file inspection was unavailable; cannot validate public repository contents safely.",
      );
    }
    const findings = await findInfrastructureInternalIdentifiers(root, files, {
      readBytes: repositoryInventory
        ? (path) => repositoryInventory.readBytes(path)
        : undefined,
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
