import { fail, pass } from "../../check-result.mjs";
import { formatOutdatedDependencies } from "./format-outdated-dependencies.mjs";
import { readOutdatedDependencies } from "./read-outdated-dependencies.mjs";
import { selectOutdatedDirectDependencies } from "./select-outdated-direct-dependencies.mjs";
import {
  formatOutdatedDependencyError,
  getOutdatedDependencies,
} from "./get-outdated-dependencies.mjs";

export const ruleId = "E-0.1.14";
export const parentRuleId = "E-0.1";
export const enforcementMode = "deterministic";

export async function run(context) {
  const { packageJson } = context;
  if (packageJson && Object.keys(packageJson.dependencies ?? {}).length === 0) return pass(ruleId);
  let outdated;
  try {
    outdated = await getOutdatedDependencies(
      context,
      context.readOutdated ?? readOutdatedDependencies,
    );
  } catch (error) {
    return fail(
      ruleId,
      `Dependency registry lookup failed: ${formatOutdatedDependencyError(error, context.env)}.`,
    );
  }
  const directOutdated = selectOutdatedDirectDependencies(packageJson, outdated);
  const findings = formatOutdatedDependencies(directOutdated);
  return findings.length
    ? fail(ruleId, `Direct dependencies are outdated: ${findings.join(", ")}.`)
    : pass(ruleId);
}
