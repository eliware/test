import { collectRedactionSecrets } from "../../../shared/output/redaction/collect-redaction-secrets.mjs";
import { normalizeRepositoryRelativePath } from "../../../shared/repository/normalize-repository/relative-path.mjs";
import { redactProcessOutput } from "../../../shared/output/redaction/redact/process-output.mjs";
import { createJestConsoleReport } from "./create/jest/console-report.mjs";

function durationSeconds(result) {
  const start = Number(result?.perfStats?.start ?? result?.startTime);
  const end = Number(result?.perfStats?.end ?? result?.endTime);
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) / 1000 : 0;
}

export default class JestProgressReporter {
  constructor(options = {}) {
    this.root = options.rootDir ?? process.cwd();
    this.write = options.write ?? ((text) => process.stderr.write(text));
    this.secrets = collectRedactionSecrets(options.env ?? process.env);
    this.consoleReport = createJestConsoleReport(
      process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT,
      options.writeConsoleReport,
    );
  }

  onTestStart(test) {
    this.writeProgress({
      event: "start",
      path: normalizeRepositoryRelativePath(test.path, this.root),
    });
  }

  onTestResult(test, result) {
    const path = normalizeRepositoryRelativePath(test.path, this.root);
    this.consoleReport.capture(path, result.console);
    const assertionFailures = (result.assertionResults ?? [])
      .filter((assertion) => assertion.status === "failed")
      .map((assertion) => {
        const title = assertion.fullName ?? assertion.title ?? "Failed test";
        const messages = assertion.failureMessages ?? [];
        return `${title}${messages.length ? `\n${messages.join("\n")}` : ""}`;
      });
    const failures = [
      result.failureMessage || assertionFailures.join("\n"),
      result.testExecError?.stack ?? result.testExecError?.message,
    ].filter((message) => typeof message === "string" && message.length > 0);
    const unexpectedOutput = (result.console ?? []).map(
      (entry) => `console.${entry.type ?? "log"}: ${entry.message ?? ""}`,
    );
    this.writeProgress({
      event: "result",
      path,
      duration: durationSeconds(result).toFixed(3),
      failed:
        (result.numFailingTests ?? 0) > 0 ||
        assertionFailures.length > 0 ||
        Boolean(result.failureMessage) ||
        Boolean(result.testExecError) ||
        unexpectedOutput.length > 0,
      failures,
      unexpectedOutput,
    });
  }

  onRunComplete(_contexts, results) {
    if (results) {
      this.writeProgress({
        event: "run-complete",
        testSuites: results.numTotalTestSuites ?? 0,
        tests: results.numTotalTests ?? 0,
      });
    }
    this.consoleReport.persist();
  }

  writeProgress(event) {
    this.writeProgressLine(JSON.stringify(event));
  }

  writeProgressLine(message) {
    this.write(`[eliware-test-progress] ${redactProcessOutput(message, this.secrets)}\n`);
  }
}
