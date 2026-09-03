/** Format Jest JSON reporter timings, slowest first. */
export function formatTestTimings(report, limit = 10) {
  const results = Array.isArray(report?.testResults) ? report.testResults : [];
  const rows = results.map((result) => {
    const start = result?.perfStats?.start ?? result?.startTime;
    const end = result?.perfStats?.end ?? result?.endTime;
    const duration = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
    const filePath = result?.testFilePath ?? result?.name;
    return { duration, file: typeof filePath === 'string' ? filePath.replaceAll('\\', '/') : 'unknown', tests: result?.assertionResults ?? [] };
  }).filter((row) => row.duration > 0).sort((a, b) => b.duration - a.duration).slice(0, limit);
  if (!rows.length) return '';
  const output = ['Test file timings:'];
  for (const { duration, file, tests } of rows) {
    output.push(`${(duration / 1000).toFixed(3)}s ${file}`);
    const cases = tests.filter((test) => Number.isFinite(test.duration))
      .sort((a, b) => b.duration - a.duration);
    for (const test of cases) {
      output.push(`  ${(test.duration / 1000).toFixed(3)}s ${test.fullName ?? test.title ?? 'unknown test'}`);
    }
  }
  output.push('');
  return output.join('\n');
}
