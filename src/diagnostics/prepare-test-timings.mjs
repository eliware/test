/** Normalize, filter, and order Jest timing report rows. */
export function prepareTestTimings(report, limit = 10) {
  const results = Array.isArray(report?.testResults) ? report.testResults : [];
  return results.map((result) => {
    const start = result?.perfStats?.start ?? result?.startTime;
    const end = result?.perfStats?.end ?? result?.endTime;
    const duration = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
    const filePath = result.testFilePath ?? result.name;
    return { duration, file: typeof filePath === 'string' ? filePath.replaceAll('\\', '/') : 'unknown', tests: result?.assertionResults ?? [] };
  }).filter((row) => row.duration > 0).sort((a, b) => b.duration - a.duration).slice(0, limit);
}
