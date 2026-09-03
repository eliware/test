import { runBuild } from '../../../src/validation/build/run-build.mjs';

test('skips absent build scripts', async () => {
  await expect(runBuild({ runBuild: async () => ({}) }, '')).resolves.toBe(0);
});

test('runs a configured build and normalizes its result', async () => {
  const calls = [];
  await expect(runBuild({ cwd: 'C:/repo', runBuild: async (...args) => { calls.push(args); return { code: 0, output: 'built' }; }, write: () => {} }, 'npm run build')).resolves.toBe(0);
  expect(calls[0][0]).toEqual(['run', 'build']);
});

test('reports build startup failures with the stable code', async () => {
  const messages = [];
  await expect(runBuild({ cwd: 'C:/repo', runBuild: async () => { throw new Error('unavailable'); }, write: (message) => messages.push(message) }, 'build')).resolves.toBe(17);
  expect(messages.join('')).toContain('Build failed to start');
});
