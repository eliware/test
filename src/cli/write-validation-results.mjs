import { writeStageDiagnostics } from "./write-stage-diagnostics.mjs";
import { writeDebugTiming } from "./write-debug-timing.mjs";

export function writeValidationResults(result, write, debugTiming, startedAt) {
  writeStageDiagnostics(result, write, debugTiming);
  if (result.code === 0 && !result.diagnostics?.length && !result.output) {
    if (result.mode == null) write(formatAggregateSuccess(result, startedAt));
    else if (!debugTiming) write(formatValidationSuccess(result.mode));
  }
  if (debugTiming) writeDebugTiming(write, startedAt, true);
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
  return `${summaries[mode]} | Exit-code: 0`;
}

function formatAggregateSuccess(result, startedAt) {
  const totalMs = Date.now() - startedAt;
  const jestMs = result.validationSummary?.jestTimeMs ?? 0;
  const checkCount = result.validationSummary?.conventionCheckCount ?? 0;
  const counts = result.validationSummary?.jestCounts ?? { testSuites: 0, tests: 0 };
  return [
    "Aggregate validation passed.",
    `Checks: ${checkCount} | Test suites: ${counts.testSuites} | Tests: ${counts.tests}`,
    "Lint warnings: 0 | Format issues: 0 | Audit issues: 0 | Pack issues: 0",
    `Checks time: ${seconds(totalMs - jestMs)}s | Jest time: ${seconds(jestMs)}s | Total time: ${seconds(totalMs)}s`,
  ].join("\n");
}

function seconds(milliseconds) {
  return Math.max(0, milliseconds / 1000).toFixed(3);
}
