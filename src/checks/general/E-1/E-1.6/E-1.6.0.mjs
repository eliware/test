import { fail, pass } from "../../../check-result.mjs";
import { isForbiddenPath } from "./sensitive-path-classifier.mjs";
import { readTrackedPaths } from "./read-tracked-paths.mjs";
import { readSensitiveExemptions } from "./read-sensitive-exemptions.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";

export const ruleId = "E-1.6.0";
export const parentRuleId = "E-1.6";

export async function run({ root, packageJson }, getTracked = readTrackedPaths) {
  const findings = [];
  const allowed = readSensitiveExemptions(packageJson, ruleId);
  try {
    let tracked;
    try {
      tracked = await getTracked(root);
      if (!Array.isArray(tracked)) {
        if (getTracked !== readTrackedPaths) throw new Error("Git inspection returned no paths.");
        tracked = await findRepositoryFiles(root);
      }
    } catch (error) {
      if (getTracked !== readTrackedPaths) throw error;
      tracked = await findRepositoryFiles(root);
    }
    findings.push(...tracked.filter((path) => isForbiddenPath(path) && !allowed.has(path)));
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
