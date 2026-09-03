import { runBuild } from '../../../src/validation/build/run-build.mjs';

test('requires a context object and skips unavailable build execution', async () => {
  await expect(runBuild(null, 'build')).rejects.toThrow('requires a context');
  await expect(runBuild({ cwd: 'C:/repo', write: () => {} }, 'build')).resolves.toBe(0);
});

test('skips absent build scripts', async () => {
  await expect(runBuild({ runBuild: async () => ({}) }, '')).resolves.toBe(0);
});

test('runs a configured build and normalizes its result', async () => {
  const calls = [];
  await expect(runBuild({ cwd: 'C:/repo', runBuild: async (...args) => { calls.push(args); return { code: 0, output: 'built' }; }, write: () => {} }, 'npm run build')).resolves.toBe(0);
  expect(calls[0][0]).toEqual(['run', 'build']);
});

test('normalizes an empty build result as a failure', async () => {
  await expect(runBuild({ cwd: 'C:/repo', runBuild: async () => undefined, write: () => {} }, 'build')).resolves.toBe(17);
});

test('reports build startup failures with the stable code', async () => {
  const messages = [];
  await expect(runBuild({ cwd: 'C:/repo', runBuild: async () => { throw new Error('unavailable'); }, write: (message) => messages.push(message) }, 'build')).resolves.toBe(17);
  expect(messages.join('')).toContain('Build failed to start');
});

test('reports a nonzero build result and preserves sanitized mode', async () => {
  const messages = [];
  let options;
  await expect(runBuild({ cwd: 'C:/repo', sanitizeEnv: true, runBuild: async (...args) => { options = args[1]; return { code: 2, output: 'compile failed' }; }, write: (message) => messages.push(message) }, 'build')).resolves.toBe(17);
  expect(options).toEqual({ cwd: 'C:/repo', inheritEnv: false });
  expect(messages.join('')).toContain('Build failed');
});
