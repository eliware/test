import { COVERAGE_CANDIDATES, hasUsableCoverage, readCoverage } from '../../src/coverage/read-coverage.mjs';

const complete = { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, b: {}, f: {} };
const text = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\ngap.mjs | 90 | 100 | 100 | 90 | 2';

test('validates required inputs and coverage candidates', async () => {
  await expect(readCoverage(null, '')).rejects.toThrow(TypeError);
  await expect(readCoverage('C:/repo', null)).rejects.toThrow(TypeError);
  expect(COVERAGE_CANDIDATES).toHaveLength(3);
  expect(hasUsableCoverage({ file: complete })).toBe(true);
  expect(hasUsableCoverage(null)).toBe(false);
  expect(hasUsableCoverage([])).toBe(false);
  expect(hasUsableCoverage({ file: { statementMap: {} } })).toBe(false);
});

test('reads the first usable JSON report', async () => {
  const result = await readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? JSON.stringify({ 'src/ok.mjs': complete }) : '');
  expect(result).toEqual([]);
});

test('rejects valid reports older than the current run', async () => {
  const report = JSON.stringify({ 'src/old.mjs': complete });
  const stale = Date.now() - 1;
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => ({ mtimeMs: stale }), Date.now()))
    .resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
});

test('accepts a valid report written during the current run', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => ({ mtimeMs: Date.now() }), Date.now() - 1))
    .resolves.toEqual([]);
});

test('accepts injected reports when freshness metadata is unavailable', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  const missing = Object.assign(new Error('metadata unavailable'), { code: 'ENOENT' });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => { throw missing; }, Date.now() - 1))
    .resolves.toEqual([]);
});

test('preserves real freshness metadata failures', async () => {
  const failure = Object.assign(new Error('stat denied'), { code: 'EACCES' });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? JSON.stringify({ 'src/current.mjs': complete }) : '', async () => { throw failure; }, Date.now() - 1))
    .rejects.toBe(failure);
});

test('falls back through missing and malformed reports to text coverage', async () => {
  const result = await readCoverage('C:/repo', text, () => {}, async (path) => {
    if (path.endsWith('coverage-final.json')) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    if (path.endsWith('coverage.json')) return '{bad';
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  });
  expect(result[0].file).toBe('gap.mjs');
});

test('skips a structurally unusable JSON report', async () => {
  const result = await readCoverage('C:/repo', text, () => {}, async (path) => {
    if (path.endsWith('coverage-final.json')) return JSON.stringify({ 'src/bad.mjs': { statementMap: {} } });
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  });
  expect(result[0].file).toBe('gap.mjs');
});

test('rejects unusable nonempty coverage evidence', async () => {
  await expect(readCoverage('C:/repo', 'test output', () => {}, async () => '{bad')).rejects.toThrow('Coverage evidence missing');
  await expect(readCoverage('C:/repo', '', () => {}, async () => '{bad')).resolves.toEqual([]);
});

test('preserves genuine coverage read failures', async () => {
  const failure = Object.assign(new Error('permission denied'), { code: 'EACCES' });
  await expect(readCoverage('C:/repo', '', () => {}, async () => { throw failure; })).rejects.toBe(failure);
});

test('reports text fallback only in debug mode', async () => {
  const previous = process.env.ELIWARE_TEST_DEBUG;
  process.env.ELIWARE_TEST_DEBUG = '1';
  const writes = [];
  try {
    await readCoverage('C:/repo', 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\nfile.mjs | 100 | 100 | 100 | 100 |', (message) => writes.push(message), async () => '');
    expect(writes).toEqual(['[Coverage fallback] using Jest text coverage\n']);
  } finally {
    if (previous === undefined) delete process.env.ELIWARE_TEST_DEBUG;
    else process.env.ELIWARE_TEST_DEBUG = previous;
  }
});

test('supports default diagnostic and file-reader collaborators', async () => {
  await expect(readCoverage('C:/path-that-does-not-exist', '')).resolves.toEqual([]);
});
