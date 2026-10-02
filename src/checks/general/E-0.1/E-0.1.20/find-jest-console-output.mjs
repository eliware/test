import { normalizeRepositoryRelativePath } from "../../../normalize-repository-relative-path.mjs";
import { redactProcessOutput } from "../../../redact-process-output.mjs";

export function findJestConsoleOutput(consoleOutput = [], root = process.cwd(), secrets = []) {
  const findings = [];
  for (const output of consoleOutput) {
    const source = redactProcessOutput(reportPath(output.testFilePath, root), secrets);
    const message = redactProcessOutput(String(output.message ?? "").trim(), secrets);
    findings.push(`console.${output.type ?? "log"} in ${source}: ${message}`);
  }
  return findings;
}

export function isDefaultJestConsoleLine(record, outputs, root = process.cwd()) {
  return outputs.some((output) => {
    if (
      record.suite !== "unknown test suite" &&
      reportPath(output.testFilePath, root) !== record.suite
    )
      return false;
    if (record.line === `console.${output.type ?? "log"}`) return true;
    return String(output.message ?? "")
      .split(/\r?\n/u)
      .some((line) => line.trim() === record.line);
  });
}

function reportPath(path, root) {
  if (typeof path !== "string" || !path) return "unknown test suite";
  return normalizeRepositoryRelativePath(path, root);
}
