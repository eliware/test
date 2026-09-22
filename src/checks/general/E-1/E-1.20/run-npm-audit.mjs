import { buildAuditArguments } from "./build-audit-arguments.mjs";
import { resolveAuditExecutable } from "./resolve-audit-executable.mjs";
export async function runNpmAudit(
  root,
  run,
  resolveCommand = resolveAuditExecutable,
  extraArgs = [],
) {
  const [command, prefix] = resolveCommand({ env: process.env, platform: process.platform, execPath: process.execPath });
  return run(command, [...prefix, ...buildAuditArguments(extraArgs)], { cwd: root });
}
