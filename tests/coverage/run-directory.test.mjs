import { promoteCoverageDirectory, prepareCoverageDirectory, TEMP_COVERAGE_DIRECTORY } from '../../src/coverage/run-directory.mjs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('prepares an isolated coverage directory', async () => {
  const calls = [];
  await expect(prepareCoverageDirectory('repo', async (...args) => calls.push(['remove', ...args]), async (...args) => calls.push(['mkdir', ...args]))).resolves.toMatch(/\.eliware-test-coverage$/);
  expect(calls.map(([name]) => name)).toEqual(['remove', 'mkdir']);
  expect(TEMP_COVERAGE_DIRECTORY).toBe('.eliware-test-coverage');
});

test('overwrites coverage with the completed isolated directory', async () => {
  const calls = [];
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async (...args) => calls.push(['remove', ...args]), async (...args) => calls.push(['rename', ...args]))).resolves.toBe(true);
  expect(calls.map(([name]) => name)).toEqual(['remove', 'rename']);
  expect(calls[0][2]).toMatchObject({ recursive: true, force: true });
});

test('does not promote missing isolated output', async () => {
  await expect(promoteCoverageDirectory('repo', 'missing', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); })).resolves.toBe(false);
});

test('reports non-missing access failures', async () => {
  await expect(promoteCoverageDirectory('repo', 'temp', async () => { throw new Error('access denied'); }))
    .rejects.toThrow('access denied');
});

test('preserves destination removal and promotion failures', async () => {
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => { throw new Error('locked'); })).rejects.toThrow('locked');
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, async () => { throw new Error('rename failed'); })).rejects.toThrow('rename failed');
});

test('uses default filesystem collaborators', async () => {
  const root = await mkdtemp(join(tmpdir(), 'eliware-test-'));
  try {
    const temporary = await prepareCoverageDirectory(root);
    await writeFile(join(temporary, 'coverage-final.json'), '{}');
    expect(await promoteCoverageDirectory(root, temporary)).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
