import { fail, pass } from "../../../check-result.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { validateWorkflowSequence } from "./validate-workflow-sequence.mjs";
import { selectWorkflowValidationJobs } from "./select-workflow-validation-jobs.mjs";
import { workflowAllowsAttestation } from "./workflow-allows-attestation.mjs";

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
  const allowAttestation = workflowAllowsAttestation(packageJson);
  const failures = [];
  for (const { name, document } of workflows) {
    const selection = selectWorkflowValidationJobs(name, document);
    if (selection.error) {
      failures.push(selection.error);
      continue;
    }
    for (const { id, job, commands: jobCommands } of selection.jobs) {
      const sequenceError = validateWorkflowSequence(
        `${name} job ${id}`,
        jobCommands,
        job.steps,
        job,
        { allowAttestation },
      );
      if (sequenceError) failures.push(sequenceError);
    }
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
