import { fail, pass } from "../../../check-result.mjs";
import { isForbiddenPath } from "./sensitive-path-classifier.mjs";
import { readTrackedPaths } from "./read-tracked-paths.mjs";
import { readSensitiveExemptions } from "./read-sensitive-exemptions.mjs";

export const ruleId = "E-1.6.0";
export const parentRuleId = "E-1.6";

export async function run({ root, packageJson }, getTracked = readTrackedPaths) {
  const findings = [];
  const allowed = readSensitiveExemptions(packageJson, ruleId);
  try {
    const tracked = await getTracked(root);
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
