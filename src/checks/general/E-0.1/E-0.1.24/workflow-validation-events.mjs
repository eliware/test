import { normalizeWorkflowEvents } from "./normalize-workflow-events.mjs";
import { pullRequestTargetsMain, pushTargetsMain } from "./workflow-targets-main.mjs";
import { containsCompliantValidationJob } from "./contains-compliant-validation-job.mjs";

export function workflowHasValidationEvents(document) {
  const { document: normalized, events, valid } = normalizeWorkflowEvents(document);
  if (!valid) return false;
  return Boolean(
    pushTargetsMain(events.push) &&
    pullRequestTargetsMain(events.pull_request) &&
    containsCompliantValidationJob("workflow.yml", normalized),
  );
}
