export function executeAuditProcess({ root, runAudit, runChild, toolArgs, env }) {
  const runWithEnvironment = (command, args, options = {}) =>
    runChild(command, args, { ...options, env });
  return runAudit({ root, run: runWithEnvironment, extraArgs: toolArgs, env });
}
