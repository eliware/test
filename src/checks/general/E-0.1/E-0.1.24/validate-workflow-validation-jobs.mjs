import { hasUbuntuRunner } from "../../../has-ubuntu-runner.mjs";
import { validateWorkflowSequence } from "./validate-workflow-sequence.mjs";

export function validateWorkflowValidationJobs(name, jobs) {
  const failures = [];
  for (const { commands, job } of jobs) {
    if (!hasUbuntuRunner(job)) {
      failures.push(`${name} validation jobs must run on an Ubuntu runner.`);
      continue;
    }
    const sequenceError = validateWorkflowSequence(name, commands, job?.steps ?? null, job);
    if (sequenceError) failures.push(sequenceError);
  }
  return failures.length ? failures.join("\n") : null;
}
