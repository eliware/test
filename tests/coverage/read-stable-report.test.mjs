import { readStableReport } from '../../src/coverage/read-stable-report.mjs';

test('reads a stable report without freshness checks when no start time exists', async () => {
  await expect(readStableReport('coverage.json', async () => 'contents', async () => ({ mtimeMs: 1 }), 0)).resolves.toEqual({ contents: 'contents', fresh: true, freshnessAvailable: true });
});

test('rejects changed contents and tracks unavailable metadata', async () => {
  let reads = 0;
  await expect(readStableReport('coverage.json', async () => ['one', 'two'][reads++], async () => ({ mtimeMs: 1 }), 1)).resolves.toBeNull();
  const missing = Object.assign(new Error('gone'), { code: 'ENOENT' });
  let stats = 0;
  await expect(readStableReport('coverage.json', async () => 'contents', async () => { stats += 1; if (stats === 2) throw missing; return { mtimeMs: 1 }; }, 1)).resolves.toMatchObject({ fresh: false });
});

test('rejects an unchanged pre-run report at the same timestamp as the run', async () => {
  await expect(readStableReport('coverage.json', async () => 'contents', async () => ({ mtimeMs: 100 }), 100))
    .resolves.toMatchObject({ fresh: false });
});

test('marks freshness unavailable when timestamps are missing', async () => {
  await expect(readStableReport('coverage.json', async () => 'contents', async () => ({}), 100))
    .resolves.toMatchObject({ fresh: false, freshnessAvailable: false });
});

test('rethrows non-missing initial stat failures', async () => {
  const failure = Object.assign(new Error('denied'), { code: 'EACCES' });
  await expect(readStableReport('coverage.json', async () => '{}', async () => { throw failure; }, 1)).rejects.toBe(failure);
});

test('rethrows non-missing failures during stable reads', async () => {
  const failure = Object.assign(new Error('denied'), { code: 'EACCES' });
  let calls = 0;
  await expect(readStableReport('coverage.json', async () => '{}', async () => {
    calls += 1;
    if (calls === 1) return { mtimeMs: 2 };
    throw failure;
  }, 1)).rejects.toBe(failure);
});

test('rejects a replacement with a different file identity', async () => {
  let stats = 0;
  await expect(readStableReport('coverage.json', async () => '{}', async () => {
    stats += 1;
    return { mtimeMs: 2, dev: 1, ino: stats === 2 ? 2 : 1 };
  }, 1)).resolves.toBeNull();
});

test('accepts a new report when no pre-run file existed', async () => {
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  let stats = 0;
  await expect(readStableReport('coverage.json', async () => '{}', async () => {
    stats += 1;
    if (stats === 1) throw missing;
    return { mtimeMs: 2 };
  }, 1)).resolves.toMatchObject({ fresh: true, freshnessAvailable: true });
});

test('rejects a report whose stable timestamp changes', async () => {
  let stats = 0;
  await expect(readStableReport('coverage.json', async () => '{}', async () => ({ mtimeMs: ++stats }), 1)).resolves.toBeNull();
});
