import { runLint, runToolkit } from '../src/runner.mjs';
import { mkdir, writeFile } from 'node:fs/promises';

const output = (messages) => (message) => messages.push(message);
const completeCoverage = ' foo.mjs | 100 | 100 | 100 | 100 |';
const base = { cwd: process.cwd(), runnerArguments: [], write: () => {} };

describe('runner orchestration', () => {
  test('runs tests then lint and reports success', async () => {
    const messages = [];
    const calls = [];
    const run = async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; };
    await expect(runToolkit({ ...base, write: output(messages), runTest: run, runLintCommand: run, runnerArguments: ['-t', 'ok'] })).resolves.toBe(0);
    expect(calls).toHaveLength(2);
    expect(messages.join('')).toContain('Tests passed');
  });

  test('reports test failures', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 2, output: 'failed test' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(2);
    expect(messages.join('')).toContain('Tests failed');
  });

  test('preserves failed test diagnostics in runner output', async () => {
    const messages = [];
    const diagnostics = 'FAIL tests/example.test.mjs\nExpected: 2\nReceived: 1\n at example.test.mjs:8:4';
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 1, output: diagnostics }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(1);
    expect(messages.join('')).toContain(diagnostics);
  });

  test('reports coverage gaps and skips lint', async () => {
    const messages = [];
    let lintCalls = 0;
    const lint = async () => { lintCalls += 1; return { code: 0, output: '' }; };
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: ' foo.mjs | 99 | 100 | 100 | 100 |' }), runLintCommand: lint })).resolves.toBe(1);
    expect(lintCalls).toBe(0);
    expect(messages.join('')).toContain('Coverage gaps');
  });

  test('reads generated JSON coverage when available', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/gap.mjs': { statementMap: { 0: { start: { line: 9 } } }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
      return { code: 0, output: '' };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(1);
    expect(messages.join('')).toContain('9');
  });

  test('falls back to text when generated JSON is invalid', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-fallback`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, '{invalid');
      return { code: 0, output: completeCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
  });

  test('surfaces unexpected coverage-file read errors', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-error`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await mkdir(`${cwd}/coverage/coverage-final.json`, { recursive: true });
      return { code: 0, output: completeCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).rejects.toBeDefined();
  });

  test('reports lint failures', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 3, output: 'warning' }) })).resolves.toBe(3);
    expect(messages.join('')).toContain('Lint failed');
  });

  test('runs standalone lint', async () => {
    const messages = [];
    await expect(runLint({ cwd: process.cwd(), write: output(messages), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    await expect(runLint({ cwd: process.cwd(), write: output(messages), runLintCommand: async () => ({ code: 1, output: 'bad lint' }) })).resolves.toBe(1);
    expect(messages.join('')).toContain('Lint passed');
  });

});
