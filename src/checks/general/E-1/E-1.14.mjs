import { fail, pass } from "../../check-result.mjs";
import { formatOutdatedDependencies } from "./format-outdated-dependencies.mjs";
import { readOutdatedDependencies } from "./read-outdated-dependencies.mjs";

export const ruleId = "E-1.14";
export const parentRuleId = "E-1";
export const enforcementMode = "deterministic";

export async function run({ root = process.cwd(), packageJson, outdatedDependencies, readOutdated = readOutdatedDependencies }) {
  if (packageJson && !["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].some((field) => Object.keys(packageJson[field] ?? {}).length)) return pass(ruleId);
  const outdated = outdatedDependencies ?? await readOutdated(root);
  const findings = formatOutdatedDependencies(outdated);
  return findings.length ? fail(ruleId, `Direct dependencies are outdated: ${findings.join(", ")}.`) : pass(ruleId);
}
