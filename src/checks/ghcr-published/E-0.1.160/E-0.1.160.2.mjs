import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { hasExactTagTrigger } from "../has-exact-tag-trigger.mjs";
import { isPublicationWorkflow } from "../workflow-publication.mjs";
import { workflowText } from "../workflow-structure.mjs";

export const ruleId = "E-0.1.160.2";
export const parentRuleId = "E-0.1.160";

export async function run(context) {
  const { root } = context;
  try {
    const workflows = await readWorkflows(root, context);
    if (
      !workflows.some(
        (workflow) =>
          isPublicationWorkflow(workflow) &&
          hasExactTagTrigger(workflow) &&
          /github\.ref|github\.ref_name|release_ref|semver/i.test(workflowText(workflow)),
      )
    )
      return fail(ruleId, "GHCR publication must be gated by an exact semantic-version tag.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
