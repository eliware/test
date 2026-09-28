const protectedOptions = new Set([
  "--json",
  "--no-json",
  "--audit-level",
  "--no-audit-level",
  "--registry",
  "--userconfig",
  "--globalconfig",
  "--location",
  "--prefix",
  "--workspace",
  "--workspaces",
  "--no-workspace",
  "--no-workspaces",
  "--include-workspace-root",
  "--no-include-workspace-root",
  "--config",
  "-c",
  "-w",
]);
const allowedOptions = new Set(["--no-fund", "--no-progress"]);

export function validateAuditArguments(args = []) {
  if (!Array.isArray(args)) {
    return "Audit arguments must be an array of strings.";
  }
  const suppliedArguments = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (typeof argument !== "string") return "Audit arguments must be an array of strings.";
    suppliedArguments.push(argument);
  }
  const failures = [];
  for (const argument of suppliedArguments) {
    if (
      argument === "--" ||
      protectedOptions.has(argument) ||
      argument.startsWith("--omit") ||
      !allowedOptions.has(argument)
    ) {
      failures.push(
        `Audit arguments cannot override the required JSON output or high audit severity: ${argument}.`,
      );
    }
  }
  return failures.length ? failures.join("\n") : null;
}
