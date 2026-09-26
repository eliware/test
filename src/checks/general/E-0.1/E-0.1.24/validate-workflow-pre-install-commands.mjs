const safePreInstallReportingCommand =
  /^echo(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const safeEnvironmentSetup =
  /^printf\s+'MAIL_OWNER_ADDRESS=[A-Za-z0-9_+.-]+@eliware\.org\\n'\s+>\s+\.env$/u;

export function validateWorkflowPreInstallCommands(name, commands, installIndex) {
  const invalidSetup = commands.some(({ command }, index) => {
    if (index >= installIndex) return false;
    const normalizedCommand = command.trim().replace(/\r?\n/gu, "\\n");
    return (
      !safePreInstallReportingCommand.test(normalizedCommand) &&
      !safeEnvironmentSetup.test(normalizedCommand)
    );
  });
  return invalidSetup
    ? `${name} may only run safe setup or reporting commands before npm ci.`
    : null;
}
