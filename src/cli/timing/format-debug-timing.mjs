import { formatTestTimings } from "./format-test-timings.mjs";
import { parseTimingReport } from "./parse-timing-report.mjs";

export function formatDebugTiming(stageLines, jestOutput) {
  const output = [...stageLines];
  if (jestOutput) {
    try {
      const formatted = formatTestTimings(parseTimingReport(jestOutput));
      if (formatted) output.push(formatted);
    } catch (error) {
      output.push(`Timing report unavailable: ${error.message}`);
    }
  }
  return output;
}
