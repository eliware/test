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
  if (mode === null) return "Aggregate validation passed.";
  return `${summaries[mode]} | Exit-code: 0`;
}
