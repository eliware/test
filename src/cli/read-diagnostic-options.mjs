import { parseFocusedArguments } from "./parse-focused-arguments.mjs";

export function readDiagnosticOptions(args) {
  const normalizedArgs = args.filter((argument) => argument !== "--");
  const modeFlags = ["--lint", "--format", "--format-check", "--audit", "--pack"];
  const modes = normalizedArgs.filter((argument) => modeFlags.includes(argument));
  const invalid = normalizedArgs.filter((argument) => typeof argument !== "string");
  if (invalid.length > 0)
    throw new Error(`Unsupported validation argument: ${invalid.join(", ")}.`);
  if (normalizedArgs.includes("--help") && normalizedArgs.includes("--version")) {
    throw new Error("--help and --version cannot be used together.");
  }
  const informational = normalizedArgs.filter(
    (argument) => argument === "--help" || argument === "--version",
  );
  if (
    informational.length > 0 &&
    normalizedArgs.some((argument) => !informational.includes(argument))
  ) {
    throw new Error("Informational commands cannot be combined with validation arguments.");
  }
  if (modes.length > 1) throw new Error("Validation mode flags are mutually exclusive.");
  const focused = modes.length === 0 ? parseFocusedArguments(normalizedArgs).positional : [];
  if (focused.length > 1) throw new Error("Only one focused test path may be supplied.");
  if (
    focused.some((argument) => !/^tests?[\\/].+\.(?:test|spec)\.[cm]?[jt]sx?$/iu.test(argument))
  ) {
    throw new Error("Focused paths must be under tests/.");
  }
  return {
    ignoredRuleIds: [
      ...(normalizedArgs.includes("--ignore-100x4") ? ["E-1.20.10"] : []),
      ...(normalizedArgs.includes("--ignore-monolith-limits") ? ["E-1.20.16"] : []),
    ],
    mode: modes[0]?.slice(2) ?? null,
    toolArgs: normalizedArgs.filter(
      (argument) =>
        !modeFlags.includes(argument) &&
        !["--debug-timing", "--ignore-100x4", "--ignore-monolith-limits"].includes(argument),
    ),
    jestArgs: normalizedArgs.filter((argument) => argument !== "--debug-timing"),
  };
}
