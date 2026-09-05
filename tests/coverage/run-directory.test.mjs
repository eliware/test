import { promoteCoverageDirectory, prepareCoverageDirectory, TEMP_COVERAGE_DIRECTORY } from '../../src/coverage/run-directory.mjs';

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

test('preserves destination removal and promotion failures', async () => {
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => { throw new Error('locked'); })).rejects.toThrow('locked');
  await expect(promoteCoverageDirectory('repo', 'temp', async () => {}, async () => {}, async () => { throw new Error('rename failed'); })).rejects.toThrow('rename failed');
});
