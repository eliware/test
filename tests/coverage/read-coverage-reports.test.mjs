import { COVERAGE_CANDIDATES, readCoverageReports } from '../../src/coverage/read-coverage-reports.mjs';
import { sep } from 'node:path';

const valid = JSON.stringify({ 'src/example.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, b: {}, f: {} } });

test('reads candidates in deterministic priority order', async () => {
  const reports = await readCoverageReports('C:/repo', async (path) => path.endsWith('coverage-final.json') ? valid : '', async () => ({ mtimeMs: 10 }));
  expect(reports[0]).toMatchObject({ name: COVERAGE_CANDIDATES[0], usable: true, fresh: true });
  expect(reports).toHaveLength(1);
});

test('records empty, malformed, and missing candidates', async () => {
  const reports = await readCoverageReports('C:/repo', async (path) => {
    if (path.endsWith('coverage-final.json')) return '';
    if (path.endsWith(`coverage${sep}coverage.json`)) return '{bad';
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  });
  expect(reports[0]).toMatchObject({ name: COVERAGE_CANDIDATES[0] });
  expect(reports[1]).toMatchObject({ malformed: true });
  expect(reports[2]).toEqual({ name: COVERAGE_CANDIDATES[2] });
});

test('uses default readers and timestamps', async () => {
  await expect(readCoverageReports(process.cwd(), async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }))
    .resolves.toHaveLength(COVERAGE_CANDIDATES.length);
});

test('uses all default readers when no collaborators are supplied', async () => {
  await expect(readCoverageReports(process.cwd())).resolves.toEqual(expect.any(Array));
});
