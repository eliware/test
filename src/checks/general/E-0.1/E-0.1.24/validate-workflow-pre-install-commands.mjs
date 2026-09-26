const safePreInstallReportingCommand =
  /^echo(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const safeEnvironmentSetup =
  /^printf\s+'MAIL_OWNER_ADDRESS=[A-Za-z0-9_+.-]+@eliware\.org\\n'\s+>\s+\.env$/u;
const safePowerShellSetup =
  /^Set-Content\s+\.env\s+'MAIL_OWNER_ADDRESS=[A-Za-z0-9_+.-]+@eliware\.org'$/iu;
const approvedSetupActions = new Set(["actions/checkout@v6", "actions/setup-node@v6"]);

export function validateWorkflowPreInstallCommands(name, commands, installIndex, steps = commands) {
  const installStep = commands.find(({ index }) => index === installIndex);
  const installPosition = installStep?.step ? steps.indexOf(installStep.step) : installIndex;
  const invalidAction = steps.some((step, index) =>
    step && typeof step === "object" && index < installPosition &&
    step.uses !== undefined && !approvedSetupActions.has(step.uses),
  );
  const invalidSetup = commands.some(({ command, index }, position) => {
    if ((index ?? position) >= installIndex) return false;
    const normalizedCommand = command.trim().replace(/\r?\n/gu, "\\n");
    return (
      !safePreInstallReportingCommand.test(normalizedCommand) &&
      !safeEnvironmentSetup.test(normalizedCommand) &&
      !safePowerShellSetup.test(normalizedCommand)
    );
  });
  return invalidSetup || invalidAction
    ? `${name} may only run safe setup or reporting commands before npm ci.`
    : null;
}
