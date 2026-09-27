import { fail, pass } from "../../../check-result.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { validateWorkflowSequence } from "./validate-workflow-sequence.mjs";
import { selectWorkflowValidationJobs } from "./select-workflow-validation-jobs.mjs";

export const ruleId = "E-0.1.24.4";
export const parentRuleId = "E-0.1.24";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, packageJson, repositoryInventory }) {
  let workflows;
  try {
    workflows = await readWorkflows(root, repositoryInventory);
  } catch (error) {
    return fail(ruleId, `Workflow YAML could not be parsed: ${error.message}`);
  }
  const allowAttestation =
    Array.isArray(packageJson?.eliware?.apply) &&
    packageJson.eliware.apply.includes("ghcr-published");
  for (const { name, document } of workflows) {
    const selection = selectWorkflowValidationJobs(name, document);
    if (selection.error) return fail(ruleId, selection.error);
    for (const { id, job, commands: jobCommands } of selection.jobs) {
      const sequenceError = validateWorkflowSequence(
        `${name} job ${id}`,
        jobCommands,
        job.steps,
        job,
        { allowAttestation },
      );
      if (sequenceError) return fail(ruleId, sequenceError);
    }
  }
  return pass(ruleId);
}
