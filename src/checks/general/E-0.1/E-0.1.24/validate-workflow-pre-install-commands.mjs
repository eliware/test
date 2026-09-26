const safePreInstallReportingCommand =
  /^echo(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const safeEnvironmentSetup =
  /^printf\s+'MAIL_OWNER_ADDRESS=[A-Za-z0-9_+.-]+@eliware\.org\\n'\s+>\s+\.env$/u;

export function validateWorkflowPreInstallCommands(name, commands, installIndex) {
  const invalidSetup = commands.some(
    ({ command }, index) => index < installIndex &&
      !safePreInstallReportingCommand.test(command) && !safeEnvironmentSetup.test(command),
  );
  return invalidSetup ? `${name} may only run safe setup or reporting commands before npm ci.` : null;
}
