import { findPublicationCommand, findUnsupportedCommands } from "./classify-workflow-commands.mjs";
import { validateWorkflowPreInstallCommands } from "./validate-workflow-pre-install-commands.mjs";

export function validateWorkflowSiblingJobs(name, jobs, validationJobIds, publicationWorkflow) {
  for (const { id, job, commands } of jobs) {
    const publicationJob = publicationWorkflow && findPublicationCommand(commands);
    if (validationJobIds.has(id) || publicationJob) continue;
    const unsupported = findUnsupportedCommands(commands);
    if (unsupported.length > 0) {
      return `${name} contains non-validation command(s): ${unsupported.join(", ")}.`;
    }
    const validationCommands = commands.filter(({ command }) =>
      /^npm\s+(?:ci|test)$/iu.test(command),
    );
    if (validationCommands.length > 0) {
      return `${name} job ${id} must keep npm ci and npm test in a validation job.`;
    }
    const setupError = validateWorkflowPreInstallCommands(
      `${name} job ${id}`,
      commands,
      job?.steps?.length ?? commands.length,
      job?.steps ?? commands.map(({ step }) => step),
    );
    if (setupError) return setupError;
  }
  return null;
}
