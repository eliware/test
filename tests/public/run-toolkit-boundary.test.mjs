import { runToolkitBoundary } from '../../src/public/run-toolkit-boundary.mjs';

test('normalizes unexpected lifecycle failures at the public boundary', async () => {
  const messages = [];
  await expect(runToolkitBoundary({
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    inspectWorkspace: async () => { throw new Error('boundary failure'); },
    runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0,
  })).resolves.toMatchObject({ code: 14, category: 'internal', message: 'boundary failure' });
  expect(messages.join('')).toContain('boundary failure');
});

test('normalizes malformed options without requiring a diagnostic writer', async () => {
  await expect(runToolkitBoundary(null)).resolves.toMatchObject({ code: 14, category: 'internal' });
});
