import { parseFocusedArguments } from "./parse-focused-arguments.mjs";

export function readDiagnosticOptions(args) {
  const normalizedArgs = [...args];
  const modeFlags = ["--lint", "--format", "--format-check", "--audit", "--pack"];
  const removedFlags = ["--ignore-100x4", "--ignore-monolith-limits"];
  const modes = normalizedArgs.filter((argument) => modeFlags.includes(argument));
  const invalid = normalizedArgs.filter((argument) => typeof argument !== "string");
  if (invalid.length > 0)
    throw new Error(`Unsupported validation argument: ${invalid.join(", ")}.`);
  if (normalizedArgs.some((argument) => removedFlags.includes(argument)))
    throw new Error("Legacy ignore flags are no longer supported.");
  if (normalizedArgs.includes("--help") && normalizedArgs.includes("--version")) {
    throw new Error("--help and --version cannot be used together.");
  }
  const informational = normalizedArgs.filter(
    (argument) => argument === "--help" || argument === "--version",
  );
  if (informational.length > 1) throw new Error("Informational commands cannot be repeated or combined.");
  if (
    informational.length > 0 &&
    normalizedArgs.some((argument) => !informational.includes(argument))
  ) {
    throw new Error("Informational commands cannot be combined with validation arguments.");
  }
  if (modes.length > 1) throw new Error("Validation mode flags are mutually exclusive.");
  const candidateFocused = parseFocusedArguments(normalizedArgs).positional;
  if (modes.length > 0 && candidateFocused.some((argument) => /^tests?[\\/].+\.(?:test|spec)\.[cm]?[jt]sx?$/iu.test(argument))) {
    throw new Error("Focused test paths cannot be combined with tool modes.");
  }
  const focused = modes.length === 0 ? candidateFocused : [];
  if (focused.length > 1) throw new Error("Only one focused test path may be supplied.");
  if (
    focused.some((argument) => !/^tests?[\\/].+\.(?:test|spec)\.[cm]?[jt]sx?$/iu.test(argument))
  ) {
    throw new Error("Focused paths must be under tests/ or specs/.");
  }
  return {
    ignoredRuleIds: [],
    mode: modes[0]?.slice(2) ?? null,
    toolArgs: normalizedArgs.filter(
      (argument) =>
        !modeFlags.includes(argument) &&
        argument !== "--debug-timing",
    ),
    jestArgs: normalizedArgs.filter((argument) => argument !== "--debug-timing"),
  };
}
