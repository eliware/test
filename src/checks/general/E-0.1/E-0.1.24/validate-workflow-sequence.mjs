import { findValidationCommandPair } from "./find-validation-command-pair.mjs";
import { hasAdjacentValidationSteps } from "./has-adjacent-validation-steps.mjs";
import { validateValidationJobConditions } from "./validate-validation-job-conditions.mjs";
import { validateWorkflowPreInstallCommands } from "./validate-workflow-pre-install-commands.mjs";
import { validateWorkflowPostTestCommands } from "./validate-workflow-post-test-commands.mjs";

export function validateWorkflowSequence(
  name,
  commands,
  steps = commands,
  job = {},
  { allowAttestation = false } = {},
) {
  const pair = findValidationCommandPair(name, commands);
  if (pair.error) return pair.error;
  const { install, test, commandIndex } = pair;
  const originalStepIndex = (entry) => {
    if (Number.isInteger(entry?.index)) return entry.index;
    const stepIndex = entry?.step ? steps.indexOf(entry.step) : -1;
    return stepIndex >= 0 ? stepIndex : commandIndex(entry);
  };
  // codescope ignore: adjacency validation rejects every step between npm ci and npm test before pre-install or post-test checks run
  if (!hasAdjacentValidationSteps(install, test, steps, commands))
    return `${name} must run npm ci immediately followed by npm test with no intervening steps.`;
  const conditionError = validateValidationJobConditions(install, test, job);
  if (conditionError) return `${name} ${conditionError}`;
  const setupError = validateWorkflowPreInstallCommands(
    name,
    commands,
    originalStepIndex(install),
    steps,
  );
  if (setupError) return setupError;
  const reportingError = validateWorkflowPostTestCommands(
    name,
    commands,
    originalStepIndex(test),
    steps,
    { allowAttestation },
  );
  if (reportingError) return reportingError;
  return null;
}
