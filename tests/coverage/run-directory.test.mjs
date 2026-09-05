import { promoteCoverageDirectory, prepareCoverageDirectory, TEMP_COVERAGE_DIRECTORY } from '../../src/coverage/run-directory.mjs';
import { mkdtemp, rm as removeDirectory, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('prepares an isolated coverage directory after removing prior artifacts', async () => {
  const calls = [];
  const path = await prepareCoverageDirectory('repo', async (...args) => calls.push(args), async (...args) => calls.push(['mkdir', ...args]));
  expect(path).toContain(TEMP_COVERAGE_DIRECTORY);
  expect(calls).toHaveLength(2);
  expect(calls[0][1]).toMatchObject({ recursive: true, force: true });
  expect(calls[1][0]).toBe('mkdir');
});

test('promotes a completed isolated directory to coverage by rename', async () => {
  const calls = [];
  await expect(promoteCoverageDirectory('repo', 'repo/.eliware-test-coverage', async () => {}, async (...args) => calls.push(['remove', ...args]), async (...args) => calls.push(['rename', ...args]))).resolves.toBe(true);
  expect(calls.map(([name]) => name)).toEqual(['remove', 'rename', 'rename', 'remove']);
});

test('does not promote when no isolated output exists', async () => {
  await expect(promoteCoverageDirectory('repo', 'missing', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, async () => {}, async () => {})).resolves.toBe(false);
});

test('uses native filesystem defaults for an atomic promotion', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'eliware-test-'));
  try {
    const temporary = await prepareCoverageDirectory(cwd);
    await writeFile(join(temporary, 'coverage-final.json'), '{}');
    await expect(promoteCoverageDirectory(cwd, temporary)).resolves.toBe(true);
  } finally {
    await removeDirectory(cwd, { recursive: true, force: true });
  }
});

test('continues when the existing coverage directory is absent', async () => {
  const calls = [];
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  let renames = 0;
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async (...args) => calls.push(['remove', ...args]), async (...args) => {
    renames += 1;
    if (renames === 1) throw missing;
    calls.push(['rename', ...args]);
  })).resolves.toBe(true);
  expect(calls.map(([name]) => name)).toEqual(['remove', 'rename', 'remove']);
});

test('keeps the promoted directory when previous-directory cleanup fails', async () => {
  const calls = [];
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async (...args) => {
    calls.push(args);
    if (calls.length === 2) throw new Error('cleanup locked');
  }, async () => {})).resolves.toBe(true);
});

test('propagates unexpected access failures', async () => {
  await expect(promoteCoverageDirectory('repo', 'broken', async () => { throw new Error('access denied'); }, async () => {}, async () => {})).rejects.toThrow('access denied');
});

test('restores the previous coverage directory when promotion fails', async () => {
  const calls = [];
  let renames = 0;
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async (...args) => calls.push(['remove', ...args]), async () => { throw new Error('locked'); })).rejects.toThrow('locked');
  expect(calls.map(([name]) => name)).toEqual(['remove']);
});

test('promotes without a previous coverage directory', async () => {
  const calls = [];
  const accessPath = async (path) => { if (path.endsWith('coverage')) throw Object.assign(new Error('missing'), { code: 'ENOENT' }); };
  await expect(promoteCoverageDirectory('repo', 'temp', accessPath, async (...args) => calls.push(['remove', ...args]), async (...args) => calls.push(['rename', ...args]))).resolves.toBe(true);
  expect(calls.map(([name]) => name)).toEqual(['remove', 'rename', 'rename', 'remove']);
});

test('preserves the promotion error if backup restoration also fails', async () => {
  let renames = 0;
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, async () => {
    renames += 1;
    if (renames > 1) throw new Error('copy locked');
  })).rejects.toThrow('copy locked');
});

test('restores the previous directory when the new directory cannot be moved', async () => {
  const calls = [];
  let renames = 0;
  const renamePath = async (...args) => {
    calls.push(args);
    renames += 1;
    if (renames === 2) throw new Error('destination locked');
  };
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, renamePath)).rejects.toThrow('destination locked');
  expect(calls).toHaveLength(3);
  expect(calls[2][0]).toMatch(/coverage\.previous$/);
  expect(calls[2][1]).toMatch(/coverage$/);
});

test('propagates failure while moving the existing coverage directory', async () => {
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, async () => { throw new Error('existing locked'); })).rejects.toThrow('existing locked');
});

test('reports but does not fail when old-directory cleanup fails', async () => {
  const warnings = [];
  let removes = 0;
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {
    removes += 1;
    throw new Error('cleanup locked');
  }, async () => {}, (error) => warnings.push(error.message))).resolves.toBe(true);
  expect(warnings).toEqual(['cleanup locked', 'cleanup locked']);
});

test('reports final backup cleanup failure without failing promotion', async () => {
  const warnings = [];
  let removes = 0;
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {
    removes += 1;
    if (removes > 1) throw new Error('final cleanup locked');
  }, async () => {}, (error) => warnings.push(error.message))).resolves.toBe(true);
  expect(warnings).toEqual(['final cleanup locked']);
});
