import { isSupportedWorkflowStep } from "./is-supported-workflow-step.mjs";

const safeReportingCommand =
  /^(?:echo|printf)(?:[ \t]+(?:"[^"`$;&|<>\r\n]*"|'[^'$`;|&<>\r\n]*'|[\w./:@=-]+))*$/u;
export function validateWorkflowPostTestCommands(
  name,
  commands,
  testIndex,
  steps = null,
  { allowAttestation = false } = {},
) {
  const workflowSteps = Array.isArray(steps) ? steps : commands;
  const invalidStepShape =
    steps !== null &&
    (!Array.isArray(steps) ||
      steps.some((step, index) => index > testIndex && !isSupportedWorkflowStep(step)));
  const invalidReporting = commands.some(({ command, index, step }, position) => {
    const originalIndex = step ? workflowSteps.indexOf(step) : (index ?? position);
    return (
      originalIndex > testIndex &&
      (/[\\<>]/u.test(command) || /[\r\n]/u.test(command) || !safeReportingCommand.test(command))
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
  return invalidStepShape || invalidReporting || invalidAction
    ? `${name} may only run reporting commands after npm test or approved reporting actions.`
    : null;
}

function isApprovedAttestation(step) {
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
