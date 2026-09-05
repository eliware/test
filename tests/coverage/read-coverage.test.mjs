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

test('preserves candidate precedence when lower-priority reads finish first', async () => {
  const preferred = JSON.stringify({ 'src/preferred.mjs': { ...complete, s: { 0: 0 } } });
  const fallback = JSON.stringify({ 'src/fallback.mjs': complete });
  const read = async (path) => {
    if (path.endsWith('coverage-final.json')) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return preferred;
    }
    if (path.endsWith('coverage.json')) return fallback;
    return '';
  };
  await expect(readCoverage('C:/repo', '', () => {}, read)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'src/preferred.mjs' })]));
});

test('rejects valid reports older than the current run', async () => {
  const report = JSON.stringify({ 'src/old.mjs': complete });
  const stale = Date.now() - 1;
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => ({ mtimeMs: stale }), Date.now()))
    .resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
});

test('accepts a valid report written during the current run', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => ({ mtimeMs: 100 }), 99))
    .resolves.toEqual([]);
});

test('accepts a report exactly at the run timestamp after cleanup', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => ({ mtimeMs: 100 }), 100))
    .resolves.toEqual([]);
});

test('rejects a report replaced between freshness checks', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  let finalCalls = 0;
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async (path) => {
    if (!path.endsWith('coverage-final.json')) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    finalCalls += 1;
    if (finalCalls === 1) return { mtimeMs: 100 };
    throw Object.assign(new Error('gone'), { code: 'ENOENT' });
  }, 100))
    .resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
});

test('rejects a report whose contents change during a stable metadata check', async () => {
  const reports = [JSON.stringify({ 'src/old.mjs': complete }), JSON.stringify({ 'src/new.mjs': complete })];
  let reads = 0;
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => {
    if (!path.endsWith('coverage-final.json')) return '';
    return reports[reads++];
  }, async (path) => path.endsWith('coverage-final.json') ? { mtimeMs: 100 } : { mtimeMs: 0 }, 100))
    .resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
});

test('accepts a report when freshness metadata appears after an unavailable pre-read stat', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  let calls = 0;
  const missing = Object.assign(new Error('metadata unavailable'), { code: 'ENOENT' });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => {
    calls += 1;
    if (calls === 1) throw missing;
    return { mtimeMs: 100 };
  }, 99)).resolves.toEqual([]);
});

test('falls back when the report disappears during freshness validation', async () => {
  const missing = Object.assign(new Error('gone'), { code: 'ENOENT' });
  let calls = 0;
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => path.endsWith('coverage-final.json') ? JSON.stringify({ 'src/current.mjs': complete }) : '', async () => {
    calls += 1;
    if (calls === 1) return { mtimeMs: 100 };
    throw missing;
  }, 100)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
});

test('falls back when freshness metadata is unavailable', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  const missing = Object.assign(new Error('metadata unavailable'), { code: 'ENOENT' });
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async () => { throw missing; }, Date.now() - 1))
    .resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
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

test('fails closed when the only JSON report is structurally malformed', async () => {
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => {
    if (path.endsWith('coverage-final.json')) return JSON.stringify({ 'src/bad.mjs': { statementMap: {} } });
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).rejects.toThrow('Coverage report is malformed: coverage/coverage-final.json');
});

test('reports malformed JSON when production output has no text fallback', async () => {
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => {
    if (path.endsWith('coverage-final.json')) return JSON.stringify({ 'src/bad.mjs': { statementMap: {} } });
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  }, async () => ({ mtimeMs: Date.now() }), Date.now() - 1)).rejects.toThrow('Coverage report is malformed');
});

test('rejects a malformed highest-priority candidate', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => {
    if (path.endsWith('coverage-final.json')) return JSON.stringify({ 'src/bad.mjs': { statementMap: {} } });
    if (path.endsWith('coverage.json')) return report;
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  }, async () => ({ mtimeMs: Date.now() }))).rejects.toThrow('Coverage report is malformed: coverage/coverage-final.json');
});

test('falls through a malformed lower-priority candidate to a usable report', async () => {
  const report = JSON.stringify({ 'src/current.mjs': complete });
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => {
    if (path.endsWith('coverage-final.json')) return report;
    if (path.endsWith('coverage.json')) return JSON.stringify({ 'src/bad.mjs': { statementMap: {} } });
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toEqual([]);
});

test('rejects a report whose file identity changes with unchanged mtime', async () => {
  let stats = 0;
  const report = JSON.stringify({ 'src/current.mjs': complete });
  await expect(readCoverage('C:/repo', text, () => {}, async (path) => path.endsWith('coverage-final.json') ? report : '', async (path) => {
    if (!path.endsWith('coverage-final.json')) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    stats += 1;
    return { mtimeMs: 100, dev: 1, ino: stats === 2 ? 1 : 2 };
  }, 100)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ file: 'gap.mjs' })]));
});

test('rejects unusable nonempty coverage evidence', async () => {
  await expect(readCoverage('C:/repo', 'test output', () => {}, async () => '{bad')).rejects.toThrow('Coverage report is malformed');
  await expect(readCoverage('C:/repo', '', () => {}, async () => '{bad')).rejects.toThrow('Coverage report is malformed');
});

test('rejects malformed coverage with empty output', async () => {
  await expect(readCoverage('C:/repo', '', () => {}, async (path) => path.endsWith('coverage-final.json')
    ? JSON.stringify({ 'src/bad.mjs': { statementMap: {} } })
    : '', async () => ({ mtimeMs: 0 }))).rejects.toThrow('Coverage report is malformed');
});

test('fails closed for empty production-run coverage evidence', async () => {
  await expect(readCoverage('C:/repo', '', () => {}, async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, Date.now()))
    .rejects.toThrow('Coverage evidence missing');
});

test('fails closed for empty coverage evidence when freshness is omitted', async () => {
  await expect(readCoverage('C:/repo', '', () => {}, async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }))
    .rejects.toThrow('Coverage evidence missing');
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
  await expect(readCoverage('C:/path-that-does-not-exist', '')).rejects.toThrow('Coverage evidence missing');
});
