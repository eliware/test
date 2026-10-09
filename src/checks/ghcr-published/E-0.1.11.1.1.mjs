import { fail, pass } from "../check-result.mjs";
import { validateGhcrPublishWorkflow } from "./E-0.1.11.1.1/validate-ghcr-publish-workflow.mjs";

export const ruleId = "E-0.1.11.1.1";

export async function run(context = {}) {
  const errors = await validateGhcrPublishWorkflow(
    context.repositoryInventory,
    context.packageJson,
  );
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
