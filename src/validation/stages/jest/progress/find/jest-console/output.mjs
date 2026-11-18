import normalizeRepositoryRelativePath from "../../../../../shared/repository/normalize-repository/relative-path.mjs";
import redactProcessOutput from "../../../../../shared/output/redaction/redact/process-output.mjs";
export default function findJestConsoleOutput(
  consoleOutput = [],
  root = process.cwd(),
  secrets = [],
) {
  const findings = [];
  for (const output of consoleOutput) {
    const source = redactProcessOutput(reportPath(output.testFilePath, root), secrets);
    const message = redactProcessOutput(String(output.message ?? "").trim(), secrets);
    findings.push(`console.${output.type ?? "log"} in ${source}: ${message}`);
  }
  return findings;
}
function reportPath(path, root) {
  if (typeof path !== "string" || !path) return "unknown test suite";
  return normalizeRepositoryRelativePath(path, root);
}
