import { execute } from "../../../execute-child-process.mjs";
import { buildAuditArguments } from "./build-audit-arguments.mjs";
import { resolveAuditExecutable } from "./resolve-audit-executable.mjs";

export async function runNpmAudit(root, run = execute) {
  const [command, prefix] = resolveAuditExecutable();
  return run(command, [...prefix, ...buildAuditArguments()], { cwd: root });
}
