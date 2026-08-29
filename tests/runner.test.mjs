import { runLint, runToolkit } from '../src/runner.mjs';
import { runOxlint } from '../src/process.mjs';
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
    expect(calls[0]).toEqual(expect.arrayContaining(['--detectOpenHandles']));
    expect(calls[1]).toEqual(expect.arrayContaining(['--ignore-pattern', 'node_modules', '--ignore-pattern', 'coverage']));
    expect(messages.join('')).toContain('Tests passed');
  });

  test('forwards focused Jest arguments in their original order', async () => {
    const calls = [];
    const runTest = async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; };
    await expect(runToolkit({
      ...base,
      runTest,
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['tests/runner.test.mjs', '--runInBand', '-t', 'keeps this exact order']
    })).resolves.toBe(0);
    expect(calls[0].slice(-4)).toEqual(['tests/runner.test.mjs', '--runInBand', '-t', 'keeps this exact order']);
  });

  test('reports test failures', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 2, output: 'failed test' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(2);
    expect(messages.join('')).toContain('Tests failed');
  });

  test('rejects a missing focused path before running the broad suite', async () => {
    const messages = [];
    let testCalls = 0;
    await expect(runToolkit({
      ...base,
      write: output(messages),
      runTest: async () => { testCalls += 1; return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['tests/does-not-exist.test.mjs']
    })).resolves.toBe(1);
    expect(testCalls).toBe(0);
    expect(messages.join('')).toContain('Focused test path not found');
  });

  test('reports forwarded arguments only when debug mode is enabled', async () => {
    const messages = [];
    const previous = process.env.ELIWARE_TEST_DEBUG;
    process.env.ELIWARE_TEST_DEBUG = '1';
    try {
      await expect(runToolkit({
        ...base,
        write: output(messages),
        runTest: async () => ({ code: 0, output: completeCoverage }),
        runLintCommand: async () => ({ code: 0, output: '' }),
        runnerArguments: ['-t', 'focused test']
      })).resolves.toBe(0);
      await expect(runToolkit({
        ...base,
        write: output(messages),
        runTest: async () => ({ code: 0, output: completeCoverage }),
        runLintCommand: async () => ({ code: 0, output: '' }),
        runnerArguments: []
      })).resolves.toBe(0);
    } finally {
      if (previous === undefined) delete process.env.ELIWARE_TEST_DEBUG;
      else process.env.ELIWARE_TEST_DEBUG = previous;
    }
    expect(messages.join('')).toContain('Debug: Jest arguments: "-t" "focused test"');
    expect(messages.join('')).toContain('Debug: Jest arguments: (none)');
  });

  test('preserves failed test diagnostics in runner output', async () => {
    const messages = [];
    const diagnostics = 'FAIL tests/example.test.mjs\nExpected: 2\nReceived: 1\n at example.test.mjs:8:4';
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 1, output: diagnostics }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(1);
    expect(messages.join('')).toContain(diagnostics);
  });

  test('deduplicates repeated failure diagnostics', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 1, output: 'FAIL example\nFAIL example\n' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(1);
    expect(messages.join('')).toBe('Tests failed (exit 1)\nFAIL example\n');
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

  test('warns when the workspace has no .gitignore without failing', async () => {
    const cwd = `${process.cwd()}/test-fixtures/coverage-gap`;
    const messages = [];
    await expect(runLint({ cwd, write: output(messages), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(messages.join('')).toContain('Warning: .gitignore is missing');
  });

  test('excludes invalid dependency and generated files from real linting', async () => {
    const messages = [];
    const cwd = `${process.cwd()}/test-fixtures/exclusions`;
    await expect(runLint({ cwd, write: output(messages), runLintCommand: runOxlint })).resolves.toBe(0);
    expect(messages.join('')).toContain('Lint passed: 0 warnings');
  });

});
