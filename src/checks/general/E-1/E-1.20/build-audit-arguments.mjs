export function buildAuditArguments(extraArgs = []) {
  return ["audit", "--json", "--audit-level=high", ...extraArgs];
}
