export function durationSeconds(result) {
  const start = Number(result?.perfStats?.start ?? result?.startTime);
  const end = Number(result?.perfStats?.end ?? result?.endTime);
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) / 1000 : 0;
}

export function formatTestStart(path) {
  return `Running ${path}...`;
}

export function formatTestResult(test, result) {
  const lines = [`Completed ${test.path} — ${durationSeconds(result).toFixed(3)}s`];
  for (const assertion of result.assertionResults ?? []) {
    if (!Number.isFinite(assertion.duration)) continue;
    const duration = assertion.duration / 1000;
    lines.push(`  ${assertion.status === "passed" ? "PASS" : assertion.status.toUpperCase()} ${assertion.fullName ?? assertion.title} — ${duration.toFixed(3)}s`);
  }
  return lines;
}
