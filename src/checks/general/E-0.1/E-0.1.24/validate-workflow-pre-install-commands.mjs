import { isSupportedWorkflowStep } from "./is-supported-workflow-step.mjs";
import { isSupportedWorkflowAction } from "./is-supported-workflow-action.mjs";
import {
  npmLatestInstallCommand,
  validateNpmInstallWorkflowSetup,
} from "./validate-npm-install-workflow-setup.mjs";

const safePreInstallReportingCommand =
  /^(?:echo|printf)(?:\s+(?:"[^"`$;&|<>]*"|'[^'$`;|&<>]*'|[\w./:@=-]+))*$/u;

export function validateWorkflowPreInstallCommands(name, commands, installIndex, steps = null) {
  const invalidStepShape =
    Array.isArray(steps) && steps.some((step) => !isSupportedWorkflowStep(step));
  const invalidAction =
    Array.isArray(steps) &&
    steps.some(
      (step) =>
        step &&
        typeof step === "object" &&
        step.uses !== undefined &&
        !isSupportedWorkflowAction(step),
    );
  const invalidSetup = commands.some(({ command, index }, position) => {
    if ((index ?? position) >= installIndex) return false;
    if (command === npmLatestInstallCommand) return false;
    return (
      /(?:\$\{\{|\}\}|[\\<>\r\n$`])/u.test(command) ||
      !safePreInstallReportingCommand.test(command.trim())
    );
  });
  const npmSetupError = validateNpmInstallWorkflowSetup(name, commands, installIndex, steps ?? []);
  return invalidSetup || invalidAction || invalidStepShape || npmSetupError
    ? `${name} may only use approved actions; other steps must be safe reporting commands.`
    : null;
}
