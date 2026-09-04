import { prepareTestTimings } from './prepare-test-timings.mjs';

/** Format Jest JSON reporter timings, slowest first. */
export function formatTestTimings(report, limit = 10) {
  const rows = prepareTestTimings(report, limit);
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
