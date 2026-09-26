import { isValidationJob, workflowJobs, workflowRunSteps } from "./read-workflows.mjs";
import { isValidationWorkflowJob } from "./classify-workflow-commands.mjs";
import { validateWorkflowSequence } from "./validate-workflow-sequence.mjs";

export function containsCompliantValidationJob(name, document) {
  return workflowJobs(document).some(({ id, job }) => {
    if (!isValidationJob(id, job)) return false;
    if (!isValidationWorkflowJob(job, workflowRunSteps)) return false;
    if (!/^ubuntu(?:-|$)/iu.test(String(job["runs-on"] ?? ""))) return false;
    return validateWorkflowSequence(name, workflowRunSteps(job), job.steps, job) === null;
  });
}
