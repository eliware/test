export function readDiagnosticOptions(args) {
  const normalizedArgs = args.filter((argument) => argument !== "--");
  const modeFlags = ["--lint", "--format", "--format-check", "--audit", "--pack"];
  const supportedFlags = new Set([
    "--help",
    "--version",
    "--debug-timing",
    "--ignore-100x4",
    "--ignore-monolith-limits",
    ...modeFlags,
  ]);
  const invalid = normalizedArgs.filter(
    (argument) => typeof argument !== "string" || (argument.startsWith("-") && !supportedFlags.has(argument)),
  );
  if (invalid.length > 0) throw new Error(`Unsupported validation argument: ${invalid.join(", ")}.`);
  if (normalizedArgs.includes("--help") && normalizedArgs.includes("--version")) {
    throw new Error("--help and --version cannot be used together.");
  }
  const informational = normalizedArgs.filter((argument) => argument === "--help" || argument === "--version");
  if (informational.length > 0 && normalizedArgs.some((argument) => !informational.includes(argument))) {
    throw new Error("Informational commands cannot be combined with validation arguments.");
  }
  const modes = normalizedArgs.filter((argument) => modeFlags.includes(argument));
  if (modes.length > 1) throw new Error("Validation mode flags are mutually exclusive.");
  const focused = normalizedArgs.filter((argument) => !argument.startsWith("-"));
  if (focused.length > 1) throw new Error("Only one focused test path may be supplied.");
  if (focused.some((argument) => !/^(?:tests?|specs?)[\\/]/u.test(argument))) {
    throw new Error("Focused paths must be under tests/ or specs/.");
  }
  return {
    ignoredRuleIds: [
      ...(normalizedArgs.includes("--ignore-100x4") ? ["E-1.20.10"] : []),
      ...(normalizedArgs.includes("--ignore-monolith-limits") ? ["E-1.20.16"] : []),
    ],
    mode: modes[0]?.slice(2) ?? null,
    jestArgs: normalizedArgs,
  };
}
