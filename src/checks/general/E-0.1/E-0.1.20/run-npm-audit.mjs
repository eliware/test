import { buildAuditArguments } from "./build-audit-arguments.mjs";
import { resolveAuditExecutable } from "./resolve-audit-executable.mjs";
export async function runNpmAudit(
  root,
  run,
  resolveCommand = resolveAuditExecutable,
  extraArgs = [],
  env = process.env,
) {
  const auditArguments = buildAuditArguments(extraArgs);
  const [command, prefix] = resolveCommand({ env, platform: process.platform, execPath: process.execPath });
  return run(command, [...prefix, ...auditArguments], { cwd: root, env: { ...env } });
}
