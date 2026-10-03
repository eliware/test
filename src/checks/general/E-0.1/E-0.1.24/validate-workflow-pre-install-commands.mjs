import { isSupportedWorkflowStep } from "./is-supported-workflow-step.mjs";
import { isSupportedWorkflowAction } from "./is-supported-workflow-action.mjs";
import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
  validateNpm12WorkflowSetup,
} from "./validate-npm12-workflow-setup.mjs";

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
    if (command === npm12InstallCommand || command === npm12VersionCheckCommand) return false;
    return (
      /(?:\$\{\{|\}\}|[\\<>\r\n$`])/u.test(command) ||
      !safePreInstallReportingCommand.test(command.trim())
    );
  });
  const versionSetupError = validateNpm12WorkflowSetup(name, commands, installIndex, steps ?? []);
  return invalidSetup || invalidAction || invalidStepShape || versionSetupError
    ? `${name} may only use approved actions; other steps must be safe reporting commands.`
    : null;
}
