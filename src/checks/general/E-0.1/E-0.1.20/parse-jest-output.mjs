import { extractJestJsonReport } from "./extract-jest-json-report.mjs";

export function parseJsonOutput(output) {
  const extracted = extractJestJsonReport(output);
  if (!extracted) return { text: output, report: null };
  const trailingOutput = output.slice(extracted.end);
  return {
    text: output.slice(0, extracted.start) + (trailingOutput.trim() ? trailingOutput : ""),
    report: extracted.report,
  };
}
