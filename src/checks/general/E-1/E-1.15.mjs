import { fail, pass } from "../../check-result.mjs";
import { formatOutdatedDependencies } from "./format-outdated-dependencies.mjs";
import { readOutdatedDependencies } from "./read-outdated-dependencies.mjs";
import { getOutdatedDependencies } from "./get-outdated-dependencies.mjs";

export const ruleId = "E-1.15";
export const parentRuleId = "E-1";
export const enforcementMode = "deterministic";

export async function run(context) {
  const { packageJson } = context;
  if (packageJson && !["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].some((field) => Object.keys(packageJson[field] ?? {}).length)) return pass(ruleId);
  const outdated = await getOutdatedDependencies(context, context.readOutdated ?? readOutdatedDependencies);
  const findings = formatOutdatedDependencies(outdated);
  return findings.length ? fail(ruleId, `Latest stable direct dependency versions are required: ${findings.join(", ")}.`) : pass(ruleId);
}
