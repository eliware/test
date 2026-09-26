import { isValidationJob, workflowCommands, workflowJobs, workflowRunSteps } from "./read-workflows.mjs";
import { findPublicationCommand, findUnsupportedCommands, isValidationWorkflowJob } from "./classify-workflow-commands.mjs";
import { validateWorkflowPreInstallCommands } from "./validate-workflow-pre-install-commands.mjs";

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
  const validationJobIds = new Set(validationJobs.map(({ id }) => id));
  for (const { id, job } of jobs) {
    if (validationJobIds.has(id)) continue;
    if (publicationWorkflow) continue;
    const commandsForJob = workflowRunSteps(job);
    const unsupported = findUnsupportedCommands(commandsForJob);
    if (unsupported.length > 0) {
      return { error: `${name} contains non-validation command(s): ${unsupported.join(", ")}.`, jobs: [] };
    }
    const validationCommands = commandsForJob.filter(({ command }) => /^npm\s+(?:ci|test)$/iu.test(command));
    if (validationCommands.length > 0) {
      return { error: `${name} job ${id} must keep npm ci and npm test in a validation job.`, jobs: [] };
    }
    const setupCommands = commandsForJob.filter(({ command }) => /^(?:echo|printf)\b/iu.test(command));
    const setupError = validateWorkflowPreInstallCommands(`${name} job ${id}`, setupCommands, setupCommands.length);
    if (setupError) return { error: setupError, jobs: [] };
  }
  return { error: null, jobs: validationJobs };
}
