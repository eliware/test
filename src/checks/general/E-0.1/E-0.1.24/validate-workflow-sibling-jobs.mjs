import { findUnsupportedCommands } from "./classify-workflow-commands.mjs";
import { validateWorkflowPreInstallCommands } from "./validate-workflow-pre-install-commands.mjs";

export function validateWorkflowSiblingJobs(name, jobs, validationJobIds, publicationWorkflow) {
  for (const { id, commands } of jobs) {
    if (validationJobIds.has(id) || publicationWorkflow) continue;
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
    const setupCommands = commands.filter(({ command }) => /^(?:echo|printf)\b/iu.test(command));
    const setupError = validateWorkflowPreInstallCommands(
      `${name} job ${id}`,
      setupCommands,
      setupCommands.length,
    );
    if (setupError) return setupError;
  }
  return null;
}
