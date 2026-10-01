import { isSupportedWorkflowStep } from "./is-supported-workflow-step.mjs";

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
    return /[\\<>\r\n]/u.test(command) || !safePreInstallReportingCommand.test(command.trim());
  });
  return invalidSetup || invalidAction || invalidStepShape
    ? `${name} may only use approved actions; other steps must be safe reporting commands.`
    : null;
}
