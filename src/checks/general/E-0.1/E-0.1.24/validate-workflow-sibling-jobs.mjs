import { findUnsupportedCommands } from "./classify-workflow-commands.mjs";
import { validateWorkflowPreInstallCommands } from "./validate-workflow-pre-install-commands.mjs";

export function validateWorkflowSiblingJobs(name, jobs, validationJobIds, publicationJobIds) {
  const failures = [];
  for (const { id, job, commands } of jobs) {
    if (validationJobIds.has(id) || publicationJobIds.has(id)) continue;
    const unsupported = findUnsupportedCommands(commands);
    if (unsupported.length > 0) {
      failures.push(`${name} contains non-validation command(s): ${unsupported.join(", ")}.`);
    }
    const validationCommands = commands.filter(({ command }) =>
      /^npm\s+(?:ci|test)$/iu.test(command),
    );
    if (validationCommands.length > 0) {
      failures.push(`${name} job ${id} must keep npm ci and npm test in a validation job.`);
    }
    const setupError = validateWorkflowPreInstallCommands(
      `${name} job ${id}`,
      commands,
      job?.steps?.length ?? commands.length,
      job?.steps ?? null,
    );
    if (setupError) failures.push(setupError);
  }
  return failures.length ? failures.join("\n") : null;
}
