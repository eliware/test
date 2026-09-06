import { formatTestTimings } from '../../diagnostics/format-test-timings.mjs';

function parseTimingReport(output) {
  for (let start = output.indexOf('{'); start >= 0; start = output.indexOf('{', start + 1)) {
    for (let end = output.lastIndexOf('}'); end > start; end = output.lastIndexOf('}', end - 1)) {
      try {
        const report = JSON.parse(output.slice(start, end + 1));
        if (Array.isArray(report?.testResults)) return report;
      } catch { /* try the next possible JSON boundary */ }
    }
  }
  throw new Error('Jest timing JSON was not found');
}

/** Emit Jest's optional in-memory timing report. */
export function handleTimingReport({ timingOutput, write }) {
  if (!timingOutput) return null;
  try {
    const output = formatTestTimings(parseTimingReport(timingOutput));
    if (output) write(output);
  }
  catch (error) { write(`Timing report unavailable: ${error.message}\n`); }
  return null;
}
