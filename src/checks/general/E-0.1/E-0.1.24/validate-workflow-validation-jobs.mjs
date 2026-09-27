import { findUnsupportedCommands } from "./classify-workflow-commands.mjs";

export function validateWorkflowValidationJobs(name, jobs) {
  for (const { commands } of jobs) {
    const unsupported = findUnsupportedCommands(commands);
    if (unsupported.length > 0) {
      return `${name} contains non-validation command(s): ${unsupported.join(", ")}.`;
    }
  }
  return null;
}
