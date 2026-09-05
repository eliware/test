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
