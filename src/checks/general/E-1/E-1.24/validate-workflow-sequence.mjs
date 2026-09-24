import { findValidationCommandPair } from "./find-validation-command-pair.mjs";
import { hasAdjacentValidationSteps } from "./has-adjacent-validation-steps.mjs";
import { validateValidationJobConditions } from "./validate-validation-job-conditions.mjs";

const safeReportingCommand =
  /^(?:echo|printf)(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const safeEnvironmentSetup = /^printf\s+'[A-Z_][A-Z0-9_]*=[A-Za-z0-9_+@.\\-]*\\n'\s+>\s+\.env$/u;

export function validateWorkflowSequence(name, commands, steps = commands, job = {}) {
  const pair = findValidationCommandPair(name, commands);
  if (pair.error) return pair.error;
  const { install, test, commandIndex } = pair;
  if (!hasAdjacentValidationSteps(install, test, steps, commands))
    return `${name} must run npm ci immediately followed by npm test with no intervening steps.`;
  const conditionError = validateValidationJobConditions(install, test, job);
  if (conditionError) return `${name} ${conditionError}`;
  if (
    commands.some(
      ({ command }, index) =>
        index < commandIndex(install) &&
        !safeReportingCommand.test(command) &&
        !safeEnvironmentSetup.test(command),
    )
  )
    return `${name} may only run safe setup or reporting commands before npm ci.`;
  if (
    commands.some(
      ({ command }, index) => index > commandIndex(test) && !safeReportingCommand.test(command),
    )
  )
    return `${name} may only run reporting commands after npm test.`;
  return null;
}
