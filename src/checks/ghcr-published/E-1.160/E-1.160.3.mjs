import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { hasUbuntuRunner } from "../has-ubuntu-runner.mjs";
import { findValidationJobs } from "../find-validation-jobs.mjs";
import { isPublicationWorkflow } from "../workflow-publication.mjs";

export const ruleId = "E-1.160.3";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const workflows = await readWorkflows(root);
    const validation = workflows.filter((workflow) =>
      findValidationJobs(workflow).some(({ job }) => hasUbuntuRunner(workflow, job)),
    );
    const publication = workflows.filter(isPublicationWorkflow);
    if (
      validation.length === 0 ||
      publication.length === 0 ||
      publication.some(
        (workflow) =>
          findValidationJobs(workflow).length > 0 || /\bnpm\s+(?:ci|test)\b/i.test(workflow.content),
      )
    )
      return fail(ruleId, "GHCR publication must be separate from the npm validation workflow.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
