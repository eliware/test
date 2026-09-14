export function findJestConsoleOutput(report) {
  const findings = [];
  for (const entry of report?.testResults ?? []) {
    for (const output of entry.console ?? []) {
      const source = entry.testFilePath ?? entry.name ?? "unknown test suite";
      const origin = output.origin ? ` (${output.origin})` : "";
      findings.push(`console.${output.type ?? "log"} in ${source}${origin}: ${String(output.message ?? "").trim()}`);
    }
  }
  return findings;
}
