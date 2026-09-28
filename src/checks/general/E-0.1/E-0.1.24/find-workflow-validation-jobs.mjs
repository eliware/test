import { isValidationJob, workflowJobs, workflowRunSteps } from "./read-workflows.mjs";
import { isValidationWorkflowJob } from "./classify-workflow-commands.mjs";

export function findWorkflowValidationJobs(document) {
  return workflowJobs(document)
    .filter(
      ({ id, job }) => isValidationJob(id, job) || isValidationWorkflowJob(job, workflowRunSteps),
    )
    .map(({ id, job }) => ({ id, job, commands: workflowRunSteps(job) }));
}
