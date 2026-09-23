import { fail, pass } from "../../../check-result.mjs";
import { isValidationJob, workflowJobs, workflowRunSteps } from "./read-workflows.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { isValidationWorkflowJob } from "./classify-workflow-commands.mjs";
import { validateWorkflowSequence } from "./validate-workflow-sequence.mjs";

export const ruleId = "A-1.24.0";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  let workflows;
  try { workflows = await readWorkflows(root); } catch (error) {
    return fail(ruleId, `Workflow YAML could not be parsed: ${error.message}`);
  }
  for (const { name, document } of workflows) {
    const validJob = workflowJobs(document).some(({ id, job }) => {
      if (!isValidationJob(id, job)) return false;
      if (!isValidationWorkflowJob(job, workflowRunSteps)) return false;
      if (!/^ubuntu(?:-|$)/iu.test(String(job["runs-on"] ?? ""))) return false;
      const commands = workflowRunSteps(job);
      return validateWorkflowSequence(name, commands, job.steps, job) === null;
    });
    if (!validJob)
      return fail(ruleId, `${name} must run npm ci followed by npm test.`);
  }
  return pass(ruleId);
}
