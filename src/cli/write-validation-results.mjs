import { writeStageDiagnostics } from "./write-stage-diagnostics.mjs";
import { writeDebugTiming } from "./write-debug-timing.mjs";
import { formatDebugTiming } from "./timing/format-debug-timing.mjs";

export function writeValidationResults(result, write, debugTiming, timing, startedAt) {
  writeStageDiagnostics(result, write);
  if (!debugTiming) {
    if (result.code === 0 && !result.diagnostics?.length && !result.output) {
      write(formatValidationSuccess(result.mode ?? null));
    }
    return;
  }
  for (const line of formatDebugTiming(timing.getLines(), timing.getJestOutput())) write(line);
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
