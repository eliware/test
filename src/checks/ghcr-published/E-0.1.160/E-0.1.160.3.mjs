import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { hasUbuntuRunner } from "../../has-ubuntu-runner.mjs";
import { findValidationJobs } from "../find-validation-jobs.mjs";
import { isPublicationWorkflow } from "../workflow-publication.mjs";

export const ruleId = "E-0.1.160.3";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root } = context;
  try {
    const workflows = await readWorkflows(root, context);
    const validation = workflows.filter(
      (workflow) =>
        !isPublicationWorkflow(workflow) &&
        findValidationJobs(workflow).some(({ job }) => hasUbuntuRunner(job)),
    );
    const publication = workflows.filter(isPublicationWorkflow);
    if (validation.length === 0 || publication.length === 0)
      return fail(
        ruleId,
        "GHCR publication must be separate from and follow the Ubuntu validation workflow.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
