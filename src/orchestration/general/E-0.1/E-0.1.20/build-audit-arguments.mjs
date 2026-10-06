import { validateAuditArguments } from "./validate-audit-arguments.mjs";

export function buildAuditArguments(extraArgs = []) {
  const error = validateAuditArguments(extraArgs);
  if (error) throw new Error(error);
  return ["audit", ...extraArgs, "--json", "--audit-level=high"];
}
