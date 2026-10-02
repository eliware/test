import { writeStageDiagnostics } from "./write-stage-diagnostics.mjs";
import { writeDebugTiming } from "./write-debug-timing.mjs";

export function writeValidationResults(result, write, debugTiming, startedAt) {
  writeStageDiagnostics(result, write, debugTiming);
  if (!debugTiming) {
    if (result.code === 0 && !result.diagnostics?.length && !result.output) {
      write(formatValidationSuccess(result.mode ?? null));
    }
    return;
  }
  writeDebugTiming(write, startedAt, true);
}

function formatValidationSuccess(mode) {
  const summaries = {
    lint: "Lint mode passed",
    format: "Formatting completed",
    "format-check": "Format check passed",
    audit: "Audit passed",
    pack: "Pack validation passed",
    focused: "Focused validation passed",
  };
  const summary =
    mode === null ? "All tests passed | 100x4 coverage | 0 lint warnings" : summaries[mode];
  return `${summary} | Exit-code: 0`;
}
