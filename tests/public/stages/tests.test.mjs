import { executeTests } from '../../../src/public/stages/tests.mjs';
test('normalizes test result', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => ({ code: 0, output: '' }), write: () => {} })).toMatchObject({ code: 0, output: '' }));
test('formats in-memory timing output after Jest succeeds', async () => {
  const messages = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, timingOutput: true, runTest: async () => ({ code: 0, output: JSON.stringify({ testResults: [] }) }), write: (message) => messages.push(message) })).resolves.toMatchObject({ code: 0 });
  expect(messages).toEqual([]);
});
test('reports test startup failures', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => { throw new Error('unavailable'); }, write: () => {} })).toMatchObject({ code: 8 }));

test('formats timing output after a failed Jest run', async () => {
  const messages = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, timingOutput: true, runTest: async () => ({ code: 1, output: JSON.stringify({ testResults: [{ testFilePath: 'tests/a.mjs', perfStats: { start: 0, end: 1000 }, assertionResults: [] }] }) }), write: (message) => messages.push(message) })).resolves.toMatchObject({ code: 1 });
  expect(messages).toContainEqual(expect.stringContaining('Test file timings:'));
});
