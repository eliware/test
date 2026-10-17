import { resolveFocusedTestPaths } from "../resolve/focused/test-paths.mjs";
import { validateInformationalArguments } from "./validate/informational-arguments.mjs";
import { validateModePlacement } from "./validate/mode-placement.mjs";

export function readDiagnosticOptions(args) {
  const normalizedArgs = [...args];
  const modeFlags = ["--lint", "--format", "--format-check", "--audit", "--pack"];
  const removedFlags = ["--ignore-100x4", "--ignore-line-limits"];
  const separatorIndex = normalizedArgs.indexOf("--");
  const wrapperArgs = separatorIndex < 0 ? normalizedArgs : normalizedArgs.slice(0, separatorIndex);
  const delegatedArgs = separatorIndex < 0 ? [] : normalizedArgs.slice(separatorIndex + 1);
  const diagnosticFlagIndexes = wrapperArgs
    .map((argument, index) => (argument === "--debug-timing" ? index : -1))
    .filter((index) => index >= 0);
  const modes = wrapperArgs.filter((argument) => modeFlags.includes(argument));
  const invalid = normalizedArgs.filter((argument) => typeof argument !== "string");
  if (invalid.length > 0)
    throw new Error(`Unsupported validation argument: ${invalid.join(", ")}.`);
  if (wrapperArgs.some((argument) => removedFlags.includes(argument)))
    throw new Error("Legacy ignore flags are no longer supported.");
  validateInformationalArguments(wrapperArgs);
  validateModePlacement(wrapperArgs, delegatedArgs, modes, modeFlags, diagnosticFlagIndexes);
  resolveFocusedTestPaths(normalizedArgs, modes.length > 0);
  return {
    mode: modes[0]?.slice(2) ?? null,
    toolArgs:
      modes.length > 0
        ? [
            ...wrapperArgs.filter((argument) => !modeFlags.includes(argument)),
            ...delegatedArgs,
          ].filter((argument) => argument !== "--debug-timing")
        : [],
    jestArgs: normalizedArgs.filter((argument) => argument !== "--debug-timing"),
  };
}
