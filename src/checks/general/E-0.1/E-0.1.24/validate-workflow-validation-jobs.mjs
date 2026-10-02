import { findUnsupportedCommands } from "./classify-workflow-commands.mjs";

export function validateWorkflowValidationJobs(name, jobs) {
  const failures = [];
  for (const { commands } of jobs) {
    const unsupported = findUnsupportedCommands(commands, { allowPostTestValidation: true });
    if (unsupported.length > 0) {
      failures.push(`${name} contains non-validation command(s): ${unsupported.join(", ")}.`);
    }
  }
  return failures.length ? failures.join("\n") : null;
}
