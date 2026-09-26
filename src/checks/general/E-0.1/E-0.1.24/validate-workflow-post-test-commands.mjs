const safeReportingCommand =
  /^(?:echo|printf)(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;

export function validateWorkflowPostTestCommands(name, commands, testIndex) {
  const invalidReporting = commands.some(
    ({ command }, index) => index > testIndex && !safeReportingCommand.test(command),
  );
  return invalidReporting ? `${name} may only run reporting commands after npm test.` : null;
}
