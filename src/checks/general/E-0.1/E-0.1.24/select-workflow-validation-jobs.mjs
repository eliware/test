import { isValidationJob, workflowCommands, workflowJobs, workflowRunSteps } from "./read-workflows.mjs";
import { findPublicationCommand, findUnsupportedCommands, isValidationWorkflowJob } from "./classify-workflow-commands.mjs";

export function selectWorkflowValidationJobs(name, document) {
  const commands = workflowCommands(document);
  const jobs = workflowJobs(document);
  const validationJobs = jobs
    .filter(({ id, job }) => isValidationJob(id, job) || isValidationWorkflowJob(job, workflowRunSteps))
    .map(({ id, job }) => ({ id, job, commands: workflowRunSteps(job) }));
  const publicationWorkflow = Boolean(findPublicationCommand(commands));
  if (publicationWorkflow && validationJobs.length === 0) {
    return { error: `${name} publication workflow must contain a separate validation job.`, jobs: [] };
  }
  if (validationJobs.length === 0) {
    return { error: `${name} must validate with npm ci followed by npm test.`, jobs: [] };
  }
  for (const { commands: jobCommands } of validationJobs) {
    const unsupported = findUnsupportedCommands(jobCommands);
    if (unsupported.length > 0) {
      return { error: `${name} contains non-validation command(s): ${unsupported.join(", ")}.`, jobs: [] };
    }
  }
  return { error: null, jobs: validationJobs };
}
