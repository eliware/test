import { fail, pass } from "../../check-result.mjs";
import { formatOutdatedDependencies } from "./format-outdated-dependencies.mjs";
import { readOutdatedDependencies } from "./read-outdated-dependencies.mjs";
import { formatOutdatedDependencyError, getOutdatedDependencies } from "./get-outdated-dependencies.mjs";

export const ruleId = "E-0.1.15";
export const parentRuleId = "E-0.1";
export const enforcementMode = "deterministic";

export async function run(context) {
  const { packageJson } = context;
  if (packageJson && !["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].some((field) => Object.keys(packageJson[field] ?? {}).length)) return pass(ruleId);
  let outdated;
  try {
    outdated = await getOutdatedDependencies(context, context.readOutdated ?? readOutdatedDependencies);
  } catch (error) {
    return fail(ruleId, `Dependency registry lookup failed: ${formatOutdatedDependencyError(error, context.env)}.`);
  }
  const findings = formatOutdatedDependencies(outdated);
  return findings.length ? fail(ruleId, `Latest stable direct dependency versions are required: ${findings.join(", ")}.`) : pass(ruleId);
}
