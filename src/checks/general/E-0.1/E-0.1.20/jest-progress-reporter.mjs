import { writeFileSync } from "node:fs";
import {
  createSafeReporterOutput,
  repositoryRelativePath,
} from "../../../create-safe-reporter-output.mjs";

function durationSeconds(result) {
  const start = Number(result?.perfStats?.start ?? result?.startTime);
  const end = Number(result?.perfStats?.end ?? result?.endTime);
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) / 1000 : 0;
}

export default class JestProgressReporter {
  constructor(options = {}) {
    this.root = options.rootDir ?? process.cwd();
    this.report = createSafeReporterOutput("eliware-test-progress", options);
    this.reportStdout = createSafeReporterOutput("eliware-test-progress", {
      ...options,
      write: options.writeStdout ?? ((text) => process.stdout.write(text)),
    });
    this.consoleReportFile = process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT;
    this.consoleOutput = [];
  }

  onTestStart(test) {
    this.writeProgress(`start ${repositoryRelativePath(test.path, this.root)}`);
  }

  onTestResult(test, result) {
    const path = repositoryRelativePath(test.path, this.root);
    for (const output of result.console ?? []) {
      this.consoleOutput.push({
        testFilePath: path,
        type: output.type,
        message: output.message,
        origin: output.origin,
      });
    }
    this.writeProgress(`complete ${path} ${durationSeconds(result).toFixed(3)}s`);
    for (const assertion of result.assertionResults ?? []) {
      if (!Number.isFinite(assertion.duration)) continue;
      const duration = assertion.duration / 1000;
      const name = assertion.fullName ?? assertion.title;
      this.writeProgress(`test ${path} :: ${name} ${duration.toFixed(3)}s`);
      if (duration > 5) this.writeProgress(`slow ${path} :: ${name} :: ${duration.toFixed(3)}s`);
    }
  }

  onRunComplete() {
    if (this.consoleReportFile)
      writeFileSync(this.consoleReportFile, JSON.stringify(this.consoleOutput), "utf8");
  }

  writeProgress(message) {
    this.report(message);
    this.reportStdout(message);
  }
}
