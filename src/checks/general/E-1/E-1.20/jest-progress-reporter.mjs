function durationSeconds(result) {
  const start = Number(result?.perfStats?.start ?? result?.startTime);
  const end = Number(result?.perfStats?.end ?? result?.endTime);
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) / 1000 : 0;
}

function report(message) {
  process.stderr.write(`[eliware-test-progress] ${message}\n`);
}

export default class JestProgressReporter {
  onTestStart(test) {
    report(`start ${test.path}`);
  }

  onTestResult(test, result) {
    report(`complete ${test.path} ${durationSeconds(result).toFixed(3)}s`);
    for (const assertion of result.assertionResults ?? []) {
      if (!Number.isFinite(assertion.duration)) continue;
      const duration = assertion.duration / 1000;
      const name = assertion.fullName ?? assertion.title;
      report(`test ${test.path} :: ${name} ${duration.toFixed(3)}s`);
      if (duration > 5) report(`slow ${test.path} :: ${name} :: ${duration.toFixed(3)}s`);
    }
  }
}
