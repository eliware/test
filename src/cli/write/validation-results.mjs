import { writeStageDiagnostics } from "./stage-diagnostics.mjs";
import { writeDebugTiming } from "./debug-timing.mjs";
import {
  formatAggregateSuccess,
  formatFocusedSuccess,
  formatValidationSuccess,
} from "./success-summary.mjs";

export function writeValidationResults(result, write, debugTiming, startedAt, timingWrite) {
  writeStageDiagnostics(result, write, debugTiming);
  const warningsOnly = (result.diagnostics ?? []).every((diagnostic) =>
    diagnostic.startsWith("WARNING:"),
  );
  if (result.code === 0 && warningsOnly && !result.output) {
    if (result.mode == null) write(formatAggregateSuccess(result, startedAt));
    else if (result.mode === "focused") write(formatFocusedSuccess(result, startedAt));
    else if (!debugTiming && !result.diagnostics?.length)
      write(formatValidationSuccess(result.mode));
  }
  if (timingWrite) writeDebugTiming(timingWrite, startedAt, true);
  else if (debugTiming) writeDebugTiming(write, startedAt, true);
}
