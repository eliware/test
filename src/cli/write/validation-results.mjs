import writeStageDiagnostics from "./stage-diagnostics.mjs";
import writeDebugTiming from "./debug-timing.mjs";
import formatAggregateSuccess from "./success-summary/format/aggregate-success.mjs";
import formatFocusedSuccess from "./success-summary/format/focused-success.mjs";
import formatValidationSuccess from "./success-summary.mjs";
export default function writeValidationResults(result, write, debugTiming, startedAt, timingWrite) {
  writeStageDiagnostics(result, write);
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
