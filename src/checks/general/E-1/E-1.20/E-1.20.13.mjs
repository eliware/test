import { fail, pass } from "../../../check-result.mjs";
import { formatOutdatedDependencies } from "../format-outdated-dependencies.mjs";
import { readOutdatedDependencies } from "../read-outdated-dependencies.mjs";
import { getOutdatedDependencies } from "../get-outdated-dependencies.mjs";

export const ruleId = "E-1.20.13";
export const parentRuleId = "E-1.20";
export const enforcementMode = "deterministic";

export async function run(context) {
  const outdated = await getOutdatedDependencies(context, context.readOutdated ?? readOutdatedDependencies);
  const findings = formatOutdatedDependencies(outdated);
  return findings.length ? fail(ruleId, `Latest stable direct dependency versions are required before release: ${findings.join(", ")}.`) : pass(ruleId);
}
