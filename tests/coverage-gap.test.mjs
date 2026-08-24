import { resolve } from 'node:path';
import { runToolkit } from '../src/runner.mjs';
import { runJest } from '../src/process.mjs';

test('reports a passing fixture with a coverage gap', async () => {
  const messages = [];
  const cwd = resolve(process.cwd(), 'test-fixtures/coverage-gap');
  const code = await runToolkit({
    cwd,
    runnerArguments: [],
    write: (message) => messages.push(message),
    runTest: runJest,
    runLintCommand: async () => ({ code: 0, output: '' })
  });
  expect(code).toBe(1);
  expect(messages.join('')).toContain('branch.mjs');
  expect(messages.join('')).toContain('Coverage gaps');
  expect(messages.join('')).toContain('Uncovered branches:');
  expect(messages.join('')).toContain('Fix: add or extend tests');
});
