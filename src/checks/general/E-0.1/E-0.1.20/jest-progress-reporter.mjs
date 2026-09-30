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
    this.report = createSafeReporterOutput("eliware-test-progress", options);
  }

  onTestStart(test) {
    this.report(`start ${repositoryRelativePath(test.path)}`);
  }

  onTestResult(test, result) {
    const path = repositoryRelativePath(test.path);
    this.report(`complete ${path} ${durationSeconds(result).toFixed(3)}s`);
    for (const assertion of result.assertionResults ?? []) {
      if (!Number.isFinite(assertion.duration)) continue;
      const duration = assertion.duration / 1000;
      const name = assertion.fullName ?? assertion.title;
      this.report(`test ${path} :: ${name} ${duration.toFixed(3)}s`);
      if (duration > 5) this.report(`slow ${path} :: ${name} :: ${duration.toFixed(3)}s`);
    }
  }
}
