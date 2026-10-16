import { normalizeCliError } from "./normalize-cli-error.mjs";
import { formatExitCode } from "./format-exit-code.mjs";

export function reportCliError(error, write) {
  const exitCode = normalizeCliError(error, write);
  write(formatExitCode(exitCode));
  return exitCode;
}
