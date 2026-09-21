import { buildAuditArguments } from "./build-audit-arguments.mjs";
import { resolveAuditExecutable } from "./resolve-audit-executable.mjs";
export async function runNpmAudit(
  root,
  run,
  resolveCommand = resolveAuditExecutable,
  extraArgs = [],
) {
  const [command, prefix] = resolveCommand();
  return run(command, [...prefix, ...buildAuditArguments(extraArgs)], { cwd: root });
}
