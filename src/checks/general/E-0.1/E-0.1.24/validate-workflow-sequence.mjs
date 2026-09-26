import { findValidationCommandPair } from "./find-validation-command-pair.mjs";
import { hasAdjacentValidationSteps } from "./has-adjacent-validation-steps.mjs";
import { validateValidationJobConditions } from "./validate-validation-job-conditions.mjs";
import { validateWorkflowPreInstallCommands } from "./validate-workflow-pre-install-commands.mjs";
import { validateWorkflowPostTestCommands } from "./validate-workflow-post-test-commands.mjs";

export function validateWorkflowSequence(name, commands, steps = commands, job = {}) {
  const pair = findValidationCommandPair(name, commands);
  if (pair.error) return pair.error;
  const { install, test, commandIndex } = pair;
  if (!hasAdjacentValidationSteps(install, test, steps, commands))
    return `${name} must run npm ci immediately followed by npm test with no intervening steps.`;
  const conditionError = validateValidationJobConditions(install, test, job);
  if (conditionError) return `${name} ${conditionError}`;
  const setupError = validateWorkflowPreInstallCommands(
    name,
    commands,
    commandIndex(install),
    steps,
    job,
  );
  if (setupError) return setupError;
  const reportingError = validateWorkflowPostTestCommands(name, commands, commandIndex(test), steps);
  if (reportingError) return reportingError;
  return null;
}
