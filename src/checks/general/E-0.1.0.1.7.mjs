import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateCiWorkflow } from "./E-0.1.0.1.7/validate-ci-workflow.mjs";

export const ruleId = "E-0.1.0.1.7";

export async function run(context = {}) {
  const errors = await validateCiWorkflow(context.repositoryInventory, context.packageJson);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
