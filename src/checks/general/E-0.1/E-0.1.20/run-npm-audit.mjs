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
  const resolved = resolveCommand({
    env,
    platform: process.platform,
    execPath: process.execPath,
    root,
  });
  if (
    !Array.isArray(resolved) ||
    resolved.length !== 2 ||
    typeof resolved[0] !== "string" ||
    !resolved[0] ||
    !Array.isArray(resolved[1]) ||
    resolved[1].some((argument) => typeof argument !== "string")
  )
    throw new TypeError("resolveCommand must return an executable and string argument prefix.");
  const [command, prefix] = resolved;
  return run(command, [...prefix, ...auditArguments], { cwd: root, env: { ...env } });
}
