import { fail, pass } from "../../../../check-result.mjs";
import { readWorkflows } from "../../E-0.1.24/read-workflow-files.mjs";
import { findMissingCiCapabilityStages } from "./find-missing-ci-capability-stages.mjs";

export const ruleId = "A-0.1.20.11.0";
export const parentRuleId = "A-0.1.20.11";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, packageJson, repositoryInventory }) {
  const required = ["typecheck", "build"].filter(
    (name) => typeof packageJson?.scripts?.[name] === "string" && packageJson.scripts[name].trim(),
  );
  if (required.length === 0) return pass(ruleId);
  let workflows;
  try {
    workflows = await readWorkflows(root, repositoryInventory);
  } catch (error) {
    return fail(
      ruleId,
      `CI workflow files could not be inspected when typecheck or build validation is declared: ${error.message}`,
    );
  }
  const missing = findMissingCiCapabilityStages(required, workflows);
  return missing.length > 0
    ? fail(ruleId, `CI must run declared validation stages: ${missing.join(", ")}.`)
    : pass(ruleId);
}
