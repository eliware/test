import { executeTests } from '../../../src/public/stages/tests.mjs';
test('normalizes test result', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => ({ code: 0, output: '' }), write: () => {} })).toMatchObject({ code: 0, output: '' }));
test('reports test startup failures', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => { throw new Error('unavailable'); }, write: () => {} })).toMatchObject({ code: 8 }));
test('promotes isolated coverage after a startup failure', async () => {
  const calls = [];
  await expect(executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, accessPath: async () => true, renamePath: async () => calls.push('rename'), removePath: async () => {}, runTest: async () => { throw new Error('unavailable'); }, write: () => {} })).resolves.toMatchObject({ code: 8 });
  expect(calls).toEqual(['rename', 'rename']);
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
