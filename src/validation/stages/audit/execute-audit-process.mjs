export const AUDIT_TIMEOUT_MS = 30_000;

export function executeAuditProcess({ root, runAudit, runChild, resolveCommand, toolArgs, env }) {
  const runWithEnvironment = (command, args, options = {}) =>
    runChild(command, args, {
      ...options,
      env,
      progressTimeoutMs: 0,
      maxRuntimeMs: AUDIT_TIMEOUT_MS,
      terminationGraceMs: 0,
      forceKillConfirmationMs: 0,
    });
  return runAudit({ root, run: runWithEnvironment, resolveCommand, extraArgs: toolArgs, env });
}
