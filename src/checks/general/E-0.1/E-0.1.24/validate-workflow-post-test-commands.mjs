import { isSupportedWorkflowStep } from "./is-supported-workflow-step.mjs";
import { isProhibitedPublishCommand } from "./is-prohibited-publish-command.mjs";

export function validateWorkflowPostTestCommands(
  name,
  commands,
  testIndex,
  steps = null,
  { allowAttestation = false } = {},
) {
  // codescope ignore: malformed non-array steps set invalidStepShape below; this fallback only keeps subsequent diagnostics safe
  const workflowSteps = Array.isArray(steps) ? steps : commands;
  const invalidStepShape =
    steps !== null &&
    (!Array.isArray(steps) ||
      steps.some((step, index) => index > testIndex && !isSupportedWorkflowStep(step)));
  const invalidCommand = commands.some(({ command, index, step }, position) => {
    const originalIndex = step ? workflowSteps.indexOf(step) : (index ?? position);
    if (originalIndex <= testIndex) return false;
    return (
      isProhibitedPublishCommand(command) ||
      step?.if !== undefined ||
      step?.["continue-on-error"] === true ||
      step?.continueOnError === true
    );
  });
  const invalidAction = workflowSteps.some((step, index) => {
    const approved = allowAttestation && isApprovedAttestation(step);
    return (
      index > testIndex &&
      typeof step?.uses === "string" &&
      (!approved || step["continue-on-error"] === true || step.continueOnError === true)
    );
  });
  return invalidStepShape || invalidCommand || invalidAction
    ? `${name} may not run prohibited publishing commands after npm test or use unsupported step forms.`
    : null;
}

function isApprovedAttestation(step) {
  // codescope ignore: this generic step-shape check permits GHCR attestations; GHCR chain validation matches subjectName and subjectDigest to the pushed image and output
  if (step?.uses !== "actions/attest@v4" || !step.with || typeof step.with !== "object")
    return false;
  const subjectName = step.with.subjectName ?? step.with["subject-name"];
  const subjectDigest = step.with.subjectDigest ?? step.with["subject-digest"];
  const pushToRegistry = step.with.pushToRegistry ?? step.with["push-to-registry"];
  return (
    typeof subjectName === "string" &&
    subjectName.length > 0 &&
    typeof subjectDigest === "string" &&
    subjectDigest.length > 0 &&
    pushToRegistry === true
  );
}
