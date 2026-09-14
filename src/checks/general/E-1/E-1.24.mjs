import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "./E-1.24/read-workflow-files.mjs";
import { workflowHasValidationEvents } from "./E-1.24/workflow-validation-events.mjs";

export const ruleId = "E-1.24";
export const parentRuleId = "E-1";

export async function run({ root }) {
  let workflows;
  try {
    workflows = await readWorkflows(root);
  } catch {
    return fail(ruleId, ".github/workflows must contain a GitHub Actions validation workflow.");
  }
  if (workflows.length === 0)
    return fail(ruleId, ".github/workflows must contain a GitHub Actions validation workflow.");
  const workflow = workflows.find(({ document }) => workflowHasValidationEvents(document));
  if (!workflow)
    return fail(
      ruleId,
      "A GitHub Actions workflow must validate pull requests and pushes to main on Ubuntu.",
    );
  return pass(ruleId);
}
