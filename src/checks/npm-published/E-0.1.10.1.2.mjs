import { fail, pass } from "../check-result.mjs";
import { validateNpmPublishWorkflow } from "./E-0.1.10.1.2/validate-npm-publish-workflow.mjs";

export const ruleId = "E-0.1.10.1.2";

export async function run(context = {}) {
  const errors = await validateNpmPublishWorkflow(context.repositoryInventory);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
