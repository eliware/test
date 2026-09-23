import { fail, pass } from "../../../check-result.mjs";
import { isValidationJob, workflowCommands, workflowJobs, workflowRunSteps } from "./read-workflows.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { findPublicationCommand, findUnsupportedCommands, isValidationWorkflowJob } from "./classify-workflow-commands.mjs";
import { validateWorkflowSequence } from "./validate-workflow-sequence.mjs";

export const ruleId = "E-1.24.4";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  let workflows;
  try { workflows = await readWorkflows(root); } catch (error) {
    return fail(ruleId, `Workflow YAML could not be parsed: ${error.message}`);
  }
  for (const { name, document } of workflows) {
    const commands = workflowCommands(document);
    const jobs = workflowJobs(document);
    const validationJobs = jobs
      .filter(({ id, job }) => isValidationJob(id, job) || isValidationWorkflowJob(job, workflowRunSteps))
      .map(({ id, job }) => ({ id, job, commands: workflowRunSteps(job) }));
    const publicationWorkflow = Boolean(findPublicationCommand(commands));
    if (publicationWorkflow && validationJobs.length === 0)
      return fail(ruleId, `${name} publication workflow must contain a separate validation job.`);
    if (validationJobs.length === 0)
      return fail(ruleId, `${name} must validate with npm ci followed by npm test.`);
    for (const { id, job, commands: jobCommands } of validationJobs) {
      const unsupported = findUnsupportedCommands(jobCommands);
      if (unsupported.length > 0)
        return fail(ruleId, `${name} contains non-validation command(s): ${unsupported.join(", ")}.`);
      const sequenceError = validateWorkflowSequence(`${name} job ${id}`, jobCommands, job.steps, job);
      if (sequenceError) return fail(ruleId, sequenceError);
    }
  }
  return pass(ruleId);
}
