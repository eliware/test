import { buildAuditArguments } from "./build-audit-arguments.mjs";
import { resolveAuditExecutable } from "./resolve-audit-executable.mjs";
export async function runNpmAudit({
  root,
  run,
  resolveCommand = resolveAuditExecutable,
  extraArgs = [],
  env = process.env,
} = {}) {
  const auditArguments = buildAuditArguments(extraArgs);
  if (typeof run !== "function") throw new TypeError("run must be a child-process runner.");
  if (typeof resolveCommand !== "function") {
    throw new TypeError("resolveCommand must be an executable resolver.");
  }
  const [command, prefix] = resolveCommand({
    env,
    platform: process.platform,
    execPath: process.execPath,
    root,
  });
  return run(command, [...prefix, ...auditArguments], { cwd: root, env: { ...env } });
}
