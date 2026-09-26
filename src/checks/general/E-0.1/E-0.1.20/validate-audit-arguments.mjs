const protectedOptions = new Set([
  "--json", "--no-json", "--audit-level", "--no-audit-level",
  "--registry", "--userconfig", "--globalconfig", "--location", "--prefix",
  "--workspace", "--workspaces", "--include-workspace-root", "--config", "-c", "-w",
]);

export function validateAuditArguments(args = []) {
  for (const argument of args) {
    const option = argument.split("=", 1)[0];
    if (argument === "--" || protectedOptions.has(option)) {
      return `Audit arguments cannot override the required JSON output or high audit severity: ${argument}.`;
    }
  }
  return null;
}
