import { fail, pass } from "../check-result.mjs";
import { validateCiWorkflow } from "./E-0.1.0.1.7/validate/ci-workflow.mjs";
import { validateWorkflowInventory } from "./E-0.1.0.1.7/validate/workflow/inventory.mjs";

export const ruleId = "E-0.1.0.1.7";
export const ownerProfile = "general";
export const requiredProfiles = ["general"];

export async function run(context = {}) {
  const errors = await validateWorkflowInventory(context.repositoryInventory, context.packageJson);
  errors.push(...(await validateCiWorkflow(context.repositoryInventory)));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
