const safeReportingCommand =
  /^(?:echo|printf)(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const approvedReportingActions = new Set(["actions/upload-artifact@v4"]);

export function validateWorkflowPostTestCommands(name, commands, testIndex, steps = commands) {
  const invalidReporting = commands.some(
    ({ command, index }, position) => (index ?? position) > testIndex && !safeReportingCommand.test(command),
  );
  const invalidAction = steps.some((step, index) =>
    index > testIndex && typeof step?.uses === "string" && !approvedReportingActions.has(step.uses),
  );
  return invalidReporting || invalidAction
    ? `${name} may only run reporting commands after npm test or approved reporting actions.`
    : null;
}
