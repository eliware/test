export function readDiagnosticOptions(args) {
  const modeFlags = ["--lint", "--format", "--format-check", "--audit", "--pack"];
  const supportedFlags = new Set([
    "--help",
    "--version",
    "--debug-timing",
    "--ignore-100x4",
    "--ignore-monolith-limits",
    "--no-runInBand",
    ...modeFlags,
  ]);
  const invalid = args.filter(
    (argument) => typeof argument !== "string" || (argument.startsWith("-") && !supportedFlags.has(argument)),
  );
  if (invalid.length > 0) throw new Error(`Unsupported validation argument: ${invalid.join(", ")}.`);
  if (args.includes("--help") && args.includes("--version")) {
    throw new Error("--help and --version cannot be used together.");
  }
  const modes = args.filter((argument) => modeFlags.includes(argument));
  if (modes.length > 1) throw new Error("Validation mode flags are mutually exclusive.");
  return {
    ignoredRuleIds: [
      ...(args.includes("--ignore-100x4") ? ["E-1.20.10"] : []),
      ...(args.includes("--ignore-monolith-limits") ? ["E-1.20.16"] : []),
    ],
    mode: modes[0]?.slice(2) ?? null,
    jestArgs: args,
  };
}
