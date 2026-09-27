const safePreInstallReportingCommand =
  /^echo(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const approvedSetupActions = new Set(["actions/checkout@v6", "actions/setup-node@v7"]);

export function validateWorkflowPreInstallCommands(name, commands, installIndex, steps = commands) {
  const invalidAction = steps.some(
    (step, index) =>
      index < installIndex &&
      step &&
      typeof step === "object" &&
      step.uses !== undefined &&
      !approvedSetupActions.has(step.uses),
  );
  const invalidSetup = commands.some(({ command, index }, position) => {
    if ((index ?? position) >= installIndex) return false;
    const normalizedCommand = command.trim().replace(/\r?\n/gu, "\\n");
    return !safePreInstallReportingCommand.test(normalizedCommand);
  });
  return invalidSetup || invalidAction
    ? `${name} may only use approved actions; other steps must be safe reporting commands.`
    : null;
}
