import { COVERAGE_CANDIDATES, hasUsableCoverage, readCoverage } from '../../src/coverage/read-coverage.mjs';

const complete = { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, b: {}, f: {} };

test('validates facade inputs and exposes candidate policy', async () => {
  await expect(readCoverage(null, '')).rejects.toThrow(TypeError);
  await expect(readCoverage('C:/repo', null)).rejects.toThrow(TypeError);
  expect(COVERAGE_CANDIDATES).toHaveLength(3);
  expect(hasUsableCoverage({ file: complete })).toBe(true);
  expect(hasUsableCoverage(null)).toBe(false);
});

test('delegates to the preferred usable coverage report', async () => {
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? JSON.stringify({ 'src/ok.mjs': complete }) : ''))
    .resolves.toEqual([]);
});

test('delegates text fallback when no usable JSON report exists', async () => {
  const output = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\ngap.mjs | 90 | 100 | 100 | 90 | 2';
  await expect(readCoverage('C:/repo', output, () => {}, async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }))
    .resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
});

test('uses default readers for a missing workspace report', async () => {
  await expect(readCoverage('C:/path-that-does-not-exist', '')).rejects.toThrow('Coverage evidence missing');
});
