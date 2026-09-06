import { executeTests } from '../../../src/public/stages/tests.mjs';
test('normalizes test result', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => ({ code: 0, output: '' }), write: () => {} })).toMatchObject({ code: 0, output: '' }));
test('formats in-memory timing output after Jest succeeds', async () => {
  const messages = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, timingOutput: true, runTest: async () => ({ code: 0, output: JSON.stringify({ testResults: [] }) }), write: (message) => messages.push(message) })).resolves.toMatchObject({ code: 0 });
  expect(messages).toEqual([]);
});
test('reports test startup failures', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => { throw new Error('unavailable'); }, write: () => {} })).toMatchObject({ code: 8 }));
test('promotes isolated coverage after a startup failure', async () => {
  const calls = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => true, renamePath: async () => calls.push('rename'), removePath: async () => {}, runTest: async () => { throw new Error('unavailable'); }, write: () => {} })).resolves.toMatchObject({ code: 8 });
  expect(calls).toEqual(['rename']);
});

test('returns coverage cleanup failure after Jest succeeds', async () => {
  const messages = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => true, renamePath: async () => { throw new Error('locked'); }, removePath: async () => {}, runTest: async () => ({ code: 0, output: '' }), write: (message) => messages.push(message) }))
    .resolves.toMatchObject({ code: 7 });
  expect(messages).toEqual(['Coverage cleanup failed: locked\n']);
});

test('returns coverage cleanup failure when startup cleanup fails', async () => {
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => true, renamePath: async () => { throw new Error('locked'); }, removePath: async () => {}, runTest: async () => { throw new Error('unavailable'); }, write: () => {} }))
    .resolves.toMatchObject({ code: 7 });
});

test('returns cleanup code when coverage preparation fails', async () => {
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => true, renamePath: async () => {}, removePath: async () => { throw new Error('prepare locked'); }, runTest: async () => ({ code: 0, output: '' }), write: () => {} })).resolves.toMatchObject({ code: 7 });
});

test('does not retain rollback cleanup after promotion', async () => {
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => true, renamePath: async () => {}, removePath: async () => {}, runTest: async () => ({ code: 0, output: '' }), write: () => {} }))
    .resolves.not.toMatchObject({ code: 7 });
});

test('does not promote coverage from a failed Jest run', async () => {
  const calls = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => true, renamePath: async () => calls.push('rename'), removePath: async () => {}, runTest: async () => ({ code: 1, output: '' }), write: () => {} }))
    .resolves.toMatchObject({ code: 1 });
  expect(calls).toEqual([]);
});

test('formats timing output after a failed Jest run', async () => {
  const messages = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, timingOutput: true, runTest: async () => ({ code: 1, output: JSON.stringify({ testResults: [{ testFilePath: 'tests/a.mjs', perfStats: { start: 0, end: 1000 }, assertionResults: [] }] }) }), write: (message) => messages.push(message) })).resolves.toMatchObject({ code: 1 });
  expect(messages).toContainEqual(expect.stringContaining('Test file timings:'));
});

test('handles an absent isolated coverage directory without attempting promotion', async () => {
  const calls = [];
  const messages = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, renamePath: async () => calls.push('rename'), removePath: async () => {}, runTest: async () => ({ code: 0, output: '' }), write: (message) => messages.push(message) }))
    .resolves.toMatchObject({ code: 0 });
  expect(calls).toEqual([]);
  expect(messages).toEqual(['Coverage cleanup warning: Jest produced no isolated coverage directory.\n']);
});
