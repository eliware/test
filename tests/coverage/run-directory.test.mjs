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
  expect(calls.map(([name]) => name)).toEqual(['remove', 'rename', 'rename', 'remove']);
  expect(calls[0][2]).toMatchObject({ recursive: true, force: true });
});

test('removes stale rollback output before promotion', async () => {
  const calls = [];
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async (...args) => calls.push(['remove', ...args]), async (...args) => calls.push(['rename', ...args]))).resolves.toBe(true);
  expect(calls.filter(([name]) => name === 'remove').map(([, path]) => path.endsWith('\\.eliware-test-coverage-previous'))).toEqual([true, true]);
});

test('does not promote missing isolated output', async () => {
  await expect(promoteCoverageDirectory('repo', 'missing', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); })).resolves.toBe(false);
});

test('promotes without a previous destination', async () => {
  const calls = [];
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await expect(promoteCoverageDirectory('repo', 'temp', async (path) => {
    if (path.endsWith('coverage')) throw missing;
  }, async (...args) => calls.push(['remove', ...args]), async (...args) => calls.push(['rename', ...args]))).resolves.toBe(true);
  expect(calls.map(([name]) => name)).toEqual(['remove', 'rename']);
});

test('restores the previous destination when promotion fails', async () => {
  const calls = [];
  let promotion = true;
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, async (...args) => {
    calls.push(args);
    if (promotion && args[0] === 'temp') { promotion = false; throw new Error('promotion failed'); }
  })).rejects.toThrow('promotion failed');
  expect(calls).toHaveLength(3);
});

test('reports destination access failures', async () => {
  const error = new Error('destination access denied');
  await expect(promoteCoverageDirectory('repo', 'temp', async (path) => {
    if (path.endsWith('coverage')) throw error;
  })).rejects.toThrow('destination access denied');
});

test('preserves promotion error when rollback also fails', async () => {
  let renames = 0;
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, async () => {
    renames += 1;
    if (renames === 1) return;
    if (renames === 2) throw new Error('promotion failed');
    throw new Error('rollback failed');
  })).rejects.toThrow('promotion failed');
});

test('does not attempt rollback when no destination existed', async () => {
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await expect(promoteCoverageDirectory('repo', 'temp', async (path) => {
    if (path.endsWith('coverage')) throw missing;
  }, async () => {}, async () => { throw new Error('promotion failed'); })).rejects.toThrow('promotion failed');
});

test('reports non-missing access failures', async () => {
  await expect(promoteCoverageDirectory('repo', 'temp', async () => { throw new Error('access denied'); }))
    .rejects.toThrow('access denied');
});

test('preserves destination removal and promotion failures', async () => {
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, async () => { throw new Error('rename failed'); })).rejects.toThrow('rename failed');
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => { throw new Error('locked'); }, async () => {})).rejects.toThrow('locked');
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
