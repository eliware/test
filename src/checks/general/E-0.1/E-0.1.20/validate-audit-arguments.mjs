const protectedOptions = new Set([
  "--json", "--no-json", "--audit-level", "--no-audit-level",
  "--registry", "--userconfig", "--globalconfig", "--location", "--prefix",
  "--workspace", "--workspaces", "--include-workspace-root", "--config", "-c", "-w",
]);
const allowedOptions = new Set([
  "--no-fund", "--no-progress",
]);

export function validateAuditArguments(args = []) {
  if (!Array.isArray(args) || args.some((argument) => typeof argument !== "string")) {
    return "Audit arguments must be an array of strings.";
  }
  for (const argument of args) {
    const option = argument.split("=", 1)[0];
    if (argument === "--" || protectedOptions.has(option) ||
        (!argument.startsWith("-") || !allowedOptions.has(option))) {
      return `Audit arguments cannot override the required JSON output or high audit severity: ${argument}.`;
    }
  }
  return null;
}
