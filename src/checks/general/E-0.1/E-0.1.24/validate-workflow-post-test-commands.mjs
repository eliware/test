import { isSupportedWorkflowStep } from "./is-supported-workflow-step.mjs";
import { isProhibitedPublishCommand } from "./is-prohibited-publish-command.mjs";
import { hasInvalidPostTestAction } from "./has-invalid-post-test-action.mjs";

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
  // codescope ignore: validateWorkflowSequence supplies the npm test index from the original steps array.
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
  const invalidAction = hasInvalidPostTestAction(workflowSteps, testIndex, allowAttestation);
  return invalidStepShape || invalidCommand || invalidAction
    ? `${name} may not run prohibited publishing commands after npm test or use unsupported step forms.`
    : null;
}
