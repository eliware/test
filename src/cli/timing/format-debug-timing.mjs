import { collectRedactionSecrets } from "../../checks/collect-redaction-secrets.mjs";
import { normalizeRepositoryRelativePath } from "../../checks/normalize-repository-relative-path.mjs";
import { redactProcessOutput } from "../../checks/redact-process-output.mjs";
import { formatTestTimings } from "./format-test-timings.mjs";
import { parseTimingReport } from "./parse-timing-report.mjs";

const MAX_TIMING_OUTPUT = 20_000;

export function formatDebugTiming(stageLines, jestOutput, options = {}) {
  const output = [...stageLines];
  if (jestOutput) {
    try {
      const report = parseTimingReport(jestOutput);
      const root = options.root ?? process.cwd();
      for (const result of report.testResults ?? []) {
        const file = result.testFilePath ?? result.name;
        if (typeof file !== "string") continue;
        result.testFilePath = normalizeRepositoryRelativePath(file, root);
        delete result.name;
      }
      const formatted = formatTestTimings(report);
      if (formatted) output.push(formatted);
    } catch (error) {
      output.push(`Timing report unavailable: ${error.message}`);
    }
  }
  const secrets = collectRedactionSecrets(options.env ?? process.env);
  const safeOutput = output.map((line) => redactProcessOutput(line, secrets));
  let remaining = MAX_TIMING_OUTPUT;
  const bounded = [];
  for (const line of safeOutput) {
    if (remaining <= 0) break;
    if (line.length <= remaining) {
      bounded.push(line);
      remaining -= line.length + 1;
      continue;
    }
    bounded.push(`${line.slice(0, Math.max(0, remaining - 1))}…`);
    break;
  }
  return bounded;
}
