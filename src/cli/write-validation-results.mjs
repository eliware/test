import { writeStageDiagnostics } from "./write-stage-diagnostics.mjs";
import { writeDebugTiming } from "./write-debug-timing.mjs";
import { formatDebugTiming } from "./timing/format-debug-timing.mjs";

export function writeValidationResults(result, write, debugTiming, timing, startedAt) {
  writeStageDiagnostics(result, write);
  if (!debugTiming) return;
  for (const line of formatDebugTiming(timing.getLines(), timing.getJestOutput())) write(line);
  writeDebugTiming(write, startedAt, true);
}
