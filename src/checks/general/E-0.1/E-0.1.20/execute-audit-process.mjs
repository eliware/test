export function executeAuditProcess({ root, runAudit, runChild, resolveCommand, toolArgs, env }) {
  const runWithEnvironment = (command, args, options = {}) =>
    runChild(command, args, { ...options, env });
  return runAudit({ root, run: runWithEnvironment, resolveCommand, extraArgs: toolArgs, env });
}
