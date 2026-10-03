import { isSupportedWorkflowStep } from "./is-supported-workflow-step.mjs";
import {
  npm12InstallCommand,
  npm12VersionCheckCommand,
  validateNpm12WorkflowSetup,
} from "./validate-npm12-workflow-setup.mjs";

const safePreInstallReportingCommand =
  /^(?:echo|printf)(?:\s+(?:"[^"`$;&|<>]*"|'[^'$`;|&<>]*'|[\w./:@=-]+))*$/u;
const approvedSetupActions = new Set(["actions/checkout@v6", "actions/setup-node@v7"]);

export function validateWorkflowPreInstallCommands(name, commands, installIndex, steps = null) {
  const invalidStepShape =
    Array.isArray(steps) &&
    steps.some((step, index) => index < installIndex && !isSupportedWorkflowStep(step));
  const invalidAction =
    Array.isArray(steps) &&
    steps.some(
      (step, index) =>
        index < installIndex &&
        step &&
        typeof step === "object" &&
        step.uses !== undefined &&
        !approvedSetupActions.has(step.uses),
    );
  const invalidSetup = commands.some(({ command, index }, position) => {
    if ((index ?? position) >= installIndex) return false;
    if (command === npm12InstallCommand || command === npm12VersionCheckCommand) return false;
    return /[\\<>\r\n]/u.test(command) || !safePreInstallReportingCommand.test(command.trim());
  });
  const versionSetupError = validateNpm12WorkflowSetup(name, commands, installIndex, steps ?? []);
  return invalidSetup || invalidAction || invalidStepShape || versionSetupError
    ? `${name} may only use approved actions; other steps must be safe reporting commands.`
    : null;
}
