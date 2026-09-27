const safePreInstallReportingCommand =
  /^echo(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const safeMailboxOwnerFileSetup =
  /^printf\s+'MAIL_OWNER_ADDRESS=[A-Za-z0-9_+.-]+@eliware\.org\\n'\s+>\s+\.env$/u;
const safePowerShellSetup =
  /^Set-Content\s+\.env\s+'MAIL_OWNER_ADDRESS=[-A-Za-z0-9_.+]+@eliware\.org'$/iu;
const approvedSetupActions = new Set(["actions/checkout@v6", "actions/setup-node@v6"]);

export function validateWorkflowPreInstallCommands(
  name,
  commands,
  installIndex,
  steps = commands,
  job = {},
) {
  const invalidAction = steps.some((step, index) =>
    index < installIndex &&
    step && typeof step === "object" &&
    step.uses !== undefined && !approvedSetupActions.has(step.uses),
  );
  const invalidSetup = commands.some(({ command, index, step }, position) => {
    if ((index ?? position) >= installIndex) return false;
    const normalizedCommand = command.trim().replace(/\r?\n/gu, "\\n");
    return (
      !safePreInstallReportingCommand.test(normalizedCommand) &&
      !safeMailboxOwnerFileSetup.test(normalizedCommand) &&
      !(
        safePowerShellSetup.test(normalizedCommand) &&
        /^(?:pwsh|powershell)$/iu.test(String(step?.shell ?? job?.defaults?.run?.shell ?? ""))
      )
    );
  });
  return invalidSetup || invalidAction
    ? `${name} may only use approved actions; other steps must be safe setup or reporting commands.`
    : null;
}
