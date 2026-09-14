import { fail, pass } from "../../../check-result.mjs";
import { formatOutdatedDependencies, readOutdatedDependencies } from "../read-outdated-dependencies.mjs";

export const ruleId = "E-1.20.13";
export const parentRuleId = "E-1.20";
export const enforcementMode = "deterministic";

export async function run({ root = process.cwd(), outdatedDependencies, readOutdated = readOutdatedDependencies }) {
  const outdated = outdatedDependencies ?? await readOutdated(root);
  const findings = formatOutdatedDependencies(outdated);
  return findings.length ? fail(ruleId, `Latest stable direct dependency versions are required before release: ${findings.join(", ")}.`) : pass(ruleId);
}
