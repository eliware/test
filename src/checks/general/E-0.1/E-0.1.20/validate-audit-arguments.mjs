const protectedOptions = new Set([
  "--json", "--no-json", "--audit-level", "--no-audit-level",
  "--registry", "--userconfig", "--globalconfig", "--location", "--prefix",
  "--workspace", "--workspaces", "--no-workspace", "--no-workspaces",
  "--include-workspace-root", "--no-include-workspace-root", "--config", "-c", "-w",
]);
const allowedOptions = new Set([
  "--no-fund", "--no-progress",
]);

export function validateAuditArguments(args = []) {
  if (!Array.isArray(args)) {
    return "Audit arguments must be an array of strings.";
  }
  const suppliedArguments = Array.from(args);
  if (suppliedArguments.some((argument) => typeof argument !== "string")) {
    return "Audit arguments must be an array of strings.";
  }
  for (const argument of suppliedArguments) {
    const option = argument.split("=", 1)[0];
    if (argument === "--" || protectedOptions.has(option) || option.startsWith("--omit") ||
        (!argument.startsWith("-") || !allowedOptions.has(option))) {
      return `Audit arguments cannot override the required JSON output or high audit severity: ${argument}.`;
    }
  }
  return null;
}
