import { fail, pass } from "../check-result.mjs";
import { validateCiWorkflow } from "./E-0.1.0.1.7/validate-ci-workflow.mjs";
import { validatePublishWorkflowOrder } from "./E-0.1.0.1.7/validate-publish-workflow-order.mjs";

export const ruleId = "E-0.1.0.1.7";

export async function run(context = {}) {
  const errors = await validateCiWorkflow(context.repositoryInventory, context.packageJson);
  errors.push(
    ...(await validatePublishWorkflowOrder(context.repositoryInventory, context.packageJson)),
  );
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
