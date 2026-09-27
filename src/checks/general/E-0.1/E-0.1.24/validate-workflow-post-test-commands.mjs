const safeReportingCommand =
  /^(?:echo|printf)(?:[ \t]+(?:"[^"`$;&|<>\r\n]*"|'[^'`;|&<>\r\n]*'|[\w./:@=-]+))*$/u;
const approvedReportingActions = new Set(["actions/upload-artifact@v6"]);

export function validateWorkflowPostTestCommands(name, commands, testIndex, steps = commands, { allowAttestation = false } = {}) {
  const invalidReporting = commands.some(
    ({ command, index, step }, position) => {
      const originalIndex = step ? steps.indexOf(step) : index ?? position;
      return originalIndex > testIndex && !safeReportingCommand.test(command);
    },
  );
  const invalidAction = steps.some((step, index) => {
    const approved = approvedReportingActions.has(step?.uses) || (allowAttestation && step?.uses === "actions/attest@v4");
    return index > testIndex && typeof step?.uses === "string" &&
      (!approved || step["continue-on-error"] === true || step.continueOnError === true);
  });
  return invalidReporting || invalidAction
    ? `${name} may only run reporting commands after npm test or approved reporting actions.`
    : null;
}
