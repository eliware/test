import { runLint, runToolkit } from '../src/runner.mjs';
import { runOxlint } from '../src/process.mjs';
import { mkdir, rm, writeFile } from 'node:fs/promises';

const output = (messages) => (message) => messages.push(message);
const completeCoverage = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\n foo.mjs | 100 | 100 | 100 | 100 |';
const gapCoverage = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\n gap.mjs | 99 | 100 | 100 | 100 |';
const base = { cwd: process.cwd(), runnerArguments: [], write: () => {} };

afterEach(async () => {
  for (const fixture of ['json-coverage', 'json-fallback', 'json-stale', 'json-empty', 'json-empty-map', 'json-no-counters', 'json-malformed', 'json-multi-malformed', 'json-array-root', 'json-counter-boundary', 'json-ignore-coverage', 'json-debug-fallback', 'json-error']) {
    await rm(`${process.cwd()}/test-fixtures/${fixture}/coverage`, { recursive: true, force: true });
  }
});

describe('runner orchestration', () => {
  test('fails before tests when Istanbul ignores violate policy', async () => {
    const messages = [];
    let invoked = false;
    await expect(runToolkit({
      ...base,
      write: output(messages),
      findIstanbulIgnores: async () => [{ file: 'src/module.mjs', line: 4 }],
      runTest: async () => { invoked = true; return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' })
    })).resolves.toBeGreaterThan(1);
    expect(invoked).toBe(false);
    expect(messages.join('')).toContain('src/module.mjs:4');
  });

  test('rejects incomplete runner collaborators', async () => {
    await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: () => {} })).rejects.toThrow('requires cwd');
  });
  test('validates separated runTestsByPath values at the runner boundary', async () => {
    const messages = [];
    let invoked = false;
    const runTest = async () => { invoked = true; return { code: 0, output: completeCoverage }; };
    await expect(runToolkit({ ...base, write: output(messages), runnerArguments: ['--runTestsByPath', 'tests/missing.test.mjs'], runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(invoked).toBe(false);
    expect(messages.join('')).toContain('Unsupported Jest option: --runTestsByPath');
  });
  test('preserves strict focused selection after a leading separator', async () => {
    const calls = [];
    const runTest = async (argumentsList) => { calls.push(argumentsList); return { code: 0, output: completeCoverage }; };
    await expect(runToolkit({ ...base, runnerArguments: ['--', 'tests/runner.test.mjs'], runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(calls[0]).toEqual(expect.arrayContaining(['--runTestsByPath', 'tests/runner.test.mjs']));
  });
  test('normalizes a separator retained after forwarded filters', async () => {
    const calls = [];
    const runTest = async (argumentsList) => { calls.push(argumentsList); return { code: 0, output: completeCoverage }; };
    await expect(runToolkit({ ...base, runnerArguments: ['-t', 'focused', '--', 'tests/runner.test.mjs'], runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(calls[0]).not.toContain('--');
    expect(calls[0]).toContain('tests/runner.test.mjs');
  });
  test('runs tests then lint and reports success', async () => {
    const messages = [];
    const calls = [];
    const run = async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; };
    await expect(runToolkit({ ...base, write: output(messages), runTest: run, runLintCommand: run, runnerArguments: ['-t', 'ok'] })).resolves.toBe(0);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual(expect.arrayContaining(['--detectOpenHandles']));
    expect(calls[0]).not.toEqual(expect.arrayContaining(['--runTestsByPath']));
    expect(calls[1]).toEqual(expect.arrayContaining(['--deny-warnings', '--ignore-pattern', 'node_modules', '--ignore-pattern', 'coverage']));
    expect(messages.join('')).toContain('Tests passed');
  });

  test('enforces raw-counter annotations in Jest text coverage', async () => {
    const messages = [];
    const annotatedGap = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\n gap.mjs | 80% (4/5) | 100% (1/1) | 100% (1/1) | 80% (4/5) | 3';
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: annotatedGap }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('omits in-band execution when explicitly disabled', async () => {
    const calls = [];
    await expect(runToolkit({ ...base, runInBand: false, runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; }, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(calls[0]).not.toContain('--runInBand');
  });

  test('normalizes direct no-runInBand arguments before focused selection', async () => {
    const calls = [];
    await expect(runToolkit({
      ...base,
      runTest: async (args, options) => { calls.push({ args, options }); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['--no-runInBand', 'tests/runner.test.mjs']
    })).resolves.toBe(0);
    expect(calls[0].args).toEqual(expect.arrayContaining(['--runTestsByPath', 'tests/runner.test.mjs']));
    expect(calls[0].args).not.toContain('--no-runInBand');
    expect(calls[0].options.runInBand).toBe(false);
  });

  test('forwards focused Jest arguments in their original order', async () => {
    const calls = [];
    const runTest = async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; };
    await expect(runToolkit({
      ...base,
      runTest,
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['tests/runner.test.mjs', '-t', 'keeps this exact order']
    })).resolves.toBe(0);
    expect(calls[0].slice(-3)).toEqual(['tests/runner.test.mjs', '-t', 'keeps this exact order']);
  });

  test('keeps mixed path and name filters together without broadening selection', async () => {
    const calls = [];
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['tests/runner.test.mjs', '-t', 'focused test']
    })).resolves.toBe(0);
    expect(calls[0]).toEqual(expect.arrayContaining(['tests/runner.test.mjs', '-t', 'focused test']));
    expect(calls[0]).not.toContain('--runTestsByPath');
  });

  test('uses strict Jest path selection for file-only focus', async () => {
    const calls = [];
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['tests/runner.test.mjs', 'tests/arguments.test.mjs']
    })).resolves.toBe(0);
    expect(calls[0]).toEqual(expect.arrayContaining(['--runTestsByPath', 'tests/runner.test.mjs', 'tests/arguments.test.mjs']));
  });

  test('limits focused coverage to mirrored source files', async () => {
    const calls = [];
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['tests/runner.test.mjs']
    })).resolves.toBe(0);
    expect(calls[0]).toEqual(expect.arrayContaining(['--collectCoverageFrom', 'src/runner.mjs']));
  });

  test('propagates non-missing source mapping access errors', async () => {
    const accessPath = async (path) => {
      if (path.endsWith('runner.test.mjs') || path.endsWith('.gitignore')) return;
      throw Object.assign(new Error('source access denied'), { code: 'EACCES' });
    };
    await expect(runToolkit({ ...base, accessPath, runnerArguments: ['tests/runner.test.mjs'], runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).rejects.toThrow('source access denied');
  });

  test('keeps broad coverage when focused paths cannot map to source files', async () => {
    const calls = [];
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['index.mjs']
    })).resolves.toBe(0);
    expect(calls[0]).not.toEqual(expect.arrayContaining(['--collectCoverageFrom']));
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['test-fixtures/coverage-gap/tests/branch.test.mjs']
    })).resolves.toBe(0);
    expect(calls[1]).not.toEqual(expect.arrayContaining(['--collectCoverageFrom']));
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['--', 'tests/runner.test.mjs']
    })).resolves.toBe(0);
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['--watch']
    })).resolves.toBe(0);
  });

  test('reports test failures', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 2, output: 'failed test' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Tests failed');
  });

  test('reports rejected test executors without throwing from orchestration', async () => {
    const messages = [];
    await expect(runToolkit({
      ...base,
      write: output(messages),
      runTest: async () => { throw new Error('executor unavailable'); },
      runLintCommand: async () => ({ code: 0, output: '' })
    })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Tests failed to start: executor unavailable');
  });

  test('reports rejected combined lint executors without throwing from orchestration', async () => {
    const messages = [];
    await expect(runToolkit({
      ...base,
      write: output(messages),
      runTest: async () => ({ code: 0, output: completeCoverage }),
      runLintCommand: async () => { throw new Error('lint unavailable'); }
    })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Lint failed to start: lint unavailable');
  });

  test('reports combined lint errors and preserves their diagnostics', async () => {
    const messages = [];
    await expect(runToolkit({
      ...base,
      write: output(messages),
      runTest: async () => ({ code: 0, output: completeCoverage }),
      runLintCommand: async () => ({ code: 2, output: 'error: no-unused-vars' })
    })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('no-unused-vars');
    const combinedMessages = [];
    await expect(runToolkit({
      ...base,
      write: output(combinedMessages),
      runTest: async () => ({ code: 0, output: completeCoverage }),
      runLintCommand: async () => ({ code: 0, output: 'warning: rule violation' })
    })).resolves.toBeGreaterThan(1);
    expect(combinedMessages.join('')).toContain('warning: rule violation');
  });

  test.each(['-t', '--testNamePattern', '--config', '--rootDir', '--testMatch', '--testPathPattern', '--selectProjects', '--projects'])('rejects missing values for %s before Jest starts', async (option) => {
    const messages = [];
    let testStarted = false;
    const runTest = async () => { testStarted = true; return { code: 0, output: '' }; };
    await expect(runToolkit({ ...base, runnerArguments: [option], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(testStarted).toBe(false);
    expect(messages.join('')).toContain(`${option} requires a value`);
  });

  test('returns a test-start failure before coverage opt-out can skip diagnostics', async () => {
    const messages = [];
    await expect(runToolkit({
      ...base,
      ignoreCoverage: true,
      write: output(messages),
      runTest: async () => { throw new Error('test unavailable'); },
      runLintCommand: async () => ({ code: 0, output: '' })
    })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Tests failed to start: test unavailable');
  });

  test('normalizes null combined lint results', async () => {
    await expect(runToolkit({
      ...base,
      runTest: async () => ({ code: 0, output: completeCoverage }),
      runLintCommand: async () => null
    })).resolves.toBeGreaterThan(1);
  });

  test('normalizes incomplete test results during failure handling', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 2 }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Tests failed');
  });

  test('normalizes non-string test output during failure handling', async () => {
    const messages = [];
    await expect(runToolkit({
      ...base,
      write: (message) => messages.push(message),
      runTest: async () => ({ code: 1, output: { unexpected: true } }),
      runLintCommand: async () => ({ code: 0, output: '' })
    })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Tests failed');
  });

  test('normalizes null test results', async () => {
    await expect(runToolkit({ ...base, write: () => {}, runTest: async () => null, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
  });

  test('normalizes a missing test exit code', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({}), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
  });

  test('rejects managed flags at the runner boundary', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runnerArguments: ['--coverage=false'], runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Unsupported Jest option');
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
    })).resolves.toBeGreaterThan(1);
    expect(testCalls).toBe(0);
    expect(messages.join('')).toContain('Focused test path not found');
  });

  test('recognizes uppercase JavaScript extensions as focused paths', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runnerArguments: ['tests/missing.TEST.MJS'], runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Focused test path not found');
  });

  test('maps mirrored JavaScript focused tests to JavaScript sources', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/tests`, { recursive: true });
    await mkdir(`${cwd}/src`, { recursive: true });
    await writeFile(`${cwd}/tests/mapped.test.js`, '');
    await writeFile(`${cwd}/src/mapped.js`, '');
    const calls = [];
    try {
      await expect(runToolkit({ cwd, runnerArguments: ['tests/mapped.test.js'], write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; }, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    } finally {
      await rm(`${cwd}/tests/mapped.test.js`, { force: true });
      await rm(`${cwd}/src/mapped.js`, { force: true });
    }
    expect(calls[0]).toEqual(expect.arrayContaining(['--collectCoverageFrom', 'src/mapped.js']));
  });

  test.each([
    ['tests\\mapped.test.js', 'src/mapped.js'],
    ['spec/mapped.spec.js', 'src/mapped.js'],
    ['test/mapped.test.js', 'src/mapped.js']
  ])('maps conventional focused path %s across separators', async (testPath, sourcePath) => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/${testPath.split(/[\\/]/)[0]}`, { recursive: true });
    await mkdir(`${cwd}/src`, { recursive: true });
    await writeFile(`${cwd}/${testPath.replaceAll('\\', '/')}`, '');
    await writeFile(`${cwd}/${sourcePath}`, '');
    const calls = [];
    try {
      await expect(runToolkit({ cwd, runnerArguments: [testPath], write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; }, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    } finally {
      await rm(`${cwd}/${testPath.replaceAll('\\', '/')}`, { force: true });
      await rm(`${cwd}/${sourcePath}`, { force: true });
    }
    expect(calls[0]).toEqual(expect.arrayContaining(['--collectCoverageFrom', sourcePath]));
  });

  test('deduplicates mirrored mappings across supported test extensions', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/tests`, { recursive: true });
    await mkdir(`${cwd}/spec`, { recursive: true });
    await mkdir(`${cwd}/src`, { recursive: true });
    await writeFile(`${cwd}/tests/shared.test.js`, '');
    await writeFile(`${cwd}/spec/shared.spec.js`, '');
    await writeFile(`${cwd}/src/shared.js`, '');
    const calls = [];
    try {
      await expect(runToolkit({ cwd, runnerArguments: ['tests/shared.test.js', 'spec/shared.spec.js'], write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; }, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    } finally {
      await rm(`${cwd}/tests/shared.test.js`, { force: true });
      await rm(`${cwd}/spec/shared.spec.js`, { force: true });
      await rm(`${cwd}/src/shared.js`, { force: true });
    }
    expect(calls[0].filter((argument) => argument === 'src/shared.js')).toHaveLength(1);
  });

  test('maps mirrored tests when the source uses another supported extension', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/tests`, { recursive: true });
    await mkdir(`${cwd}/src`, { recursive: true });
    await writeFile(`${cwd}/tests/cross.test.ts`, '');
    await writeFile(`${cwd}/src/cross.mjs`, '');
    const calls = [];
    try {
      await expect(runToolkit({ cwd, runnerArguments: ['tests/cross.test.ts'], write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; }, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    } finally {
      await rm(`${cwd}/tests/cross.test.ts`, { force: true });
      await rm(`${cwd}/src/cross.mjs`, { force: true });
    }
    expect(calls[0]).toEqual(expect.arrayContaining(['--collectCoverageFrom', 'src/cross.mjs']));
  });

  test('keeps broad coverage when mirrored source mapping is ambiguous', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/tests`, { recursive: true });
    await mkdir(`${cwd}/src`, { recursive: true });
    await writeFile(`${cwd}/tests/ambiguous.test.ts`, '');
    await writeFile(`${cwd}/src/ambiguous.ts`, '');
    await writeFile(`${cwd}/src/ambiguous.mjs`, '');
    const calls = [];
    try {
      await expect(runToolkit({ cwd, runnerArguments: ['tests/ambiguous.test.ts'], write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; }, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    } finally {
      await rm(`${cwd}/tests/ambiguous.test.ts`, { force: true });
      await rm(`${cwd}/src/ambiguous.ts`, { force: true });
      await rm(`${cwd}/src/ambiguous.mjs`, { force: true });
    }
    expect(calls[0]).not.toContain('--collectCoverageFrom');
  });

  test('reports unexpected focused-path access failures', async () => {
    const messages = [];
    let accessCalls = 0;
    const accessPath = async () => {
      accessCalls += 1;
      if (accessCalls > 1) throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    };
    await expect(runToolkit({ ...base, write: output(messages), accessPath, runnerArguments: ['tests/runner.test.mjs'], runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Focused test path validation failed: permission denied');
  });

  test('rejects any missing path in a multi-file focused invocation', async () => {
    let testCalls = 0;
    const messages = [];
    await expect(runToolkit({
      ...base,
      write: output(messages),
      runTest: async () => { testCalls += 1; return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['tests/runner.test.mjs', 'tests/does-not-exist.test.mjs']
    })).resolves.toBeGreaterThan(1);
    expect(testCalls).toBe(0);
    expect(messages.join('')).toContain('does-not-exist.test.mjs');
  });

  test('does not misclassify equals-form option values as focused paths', async () => {
    const calls = [];
    await expect(runToolkit({
      ...base,
      runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' }),
      runnerArguments: ['--config=tests/not-a-focused-path.mjs']
    })).resolves.toBe(0);
    expect(calls[0]).toContain('--config=tests/not-a-focused-path.mjs');
  });

  test('does not misclassify separated output-file option values as focused paths', async () => {
    const calls = [];
    await expect(runToolkit({ ...base, runnerArguments: ['--outputFile', 'reports/result.mjs'], runTest: async (args) => { calls.push(args); return { code: 0, output: completeCoverage }; }, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(calls[0]).toContain('reports/result.mjs');
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
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 1, output: diagnostics }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain(diagnostics);
  });

  test('omits coverage output when tests fail', async () => {
    const messages = [];
    const outputWithCoverage = 'FAIL tests/example.test.mjs\nExpected: 2\nReceived: 1\nCoverage report\nFile | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\nsrc/example.mjs | 80% | 90% | 100% | 80% | 4';
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 1, output: outputWithCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('FAIL tests/example.test.mjs');
    expect(messages.join('')).toContain('Received: 1');
    expect(messages.join('')).not.toContain('Coverage report');
    expect(messages.join('')).not.toContain('src/example.mjs');
  });

  test('deduplicates repeated failure diagnostics', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 1, output: 'FAIL example\nFAIL example\n' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toBe('Tests failed (exit 1)\nFAIL example\n');
  });

  // codescope ignore: injected collaborators cover runner sequencing; the real lint executor is validated by the CLI/lint tests.
  test('reports coverage gaps and skips lint', async () => {
    const messages = [];
    let lintCalls = 0;
    const lint = async () => { lintCalls += 1; return { code: 0, output: '' }; };
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: gapCoverage.replace('gap.mjs', 'foo.mjs') }), runLintCommand: lint })).resolves.toBeGreaterThan(1);
    expect(lintCalls).toBe(0);
    expect(messages.join('')).toContain('Coverage gaps');
  });

  test('runs lint while ignoring coverage enforcement when requested', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, ignoreCoverage: true, write: output(messages), runTest: async () => ({ code: 0, output: ' foo.mjs | 0 | 0 | 0 | 0 |' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(messages.join('')).toContain('Coverage: ignored');
  });

  test('ignores malformed and empty JSON while still running lint', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-ignore-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    let lintCalls = 0;
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, '{invalid');
      await writeFile(`${cwd}/coverage/coverage.json`, '{}');
      return { code: 0, output: '' };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], ignoreCoverage: true, write: output(messages), runTest, runLintCommand: async () => { lintCalls += 1; return { code: 0, output: '' }; } })).resolves.toBe(0);
    expect(lintCalls).toBe(1);
    expect(messages.join('')).toContain('Coverage: ignored');
  });

  test.each([
    { statementMap: { 0: {} }, s: { 0: 1, 1: 1 } },
    { statementMap: { 0: {}, 1: {} }, s: { 0: 1 } }
  ])('rejects JSON coverage with mismatched statement keys: %p', async (entry) => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/mismatch.mjs': { ...entry, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
    try {
      const messages = [];
      await expect(runToolkit({ ...base, cwd, write: output(messages), runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
      expect(messages.join('')).toContain('Coverage evidence missing');
    } finally {
      await rm(`${cwd}/coverage/coverage-final.json`, { force: true });
    }
  });

  // codescope ignore: representative malformed-counter tests cover the authoritative candidate-validation boundary; direct parser tests cover mixed malformed entries.
  test('reads generated JSON coverage when available', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/gap.mjs': { statementMap: { 0: { start: { line: 9 } } }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
      return { code: 0, output: '' };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('9');
  });

  test.each([
    { l: { 1: 1, 2: 0 }, expected: 11 },
    { l: { bad: 1 }, expected: 0 },
    { l: ['invalid'], expected: 0 }
  ])('validates optional Istanbul line maps: %p', async ({ l, expected }) => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/lines.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}, l
    }}));
    const messages = [];
    const code = await runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest: async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/lines.mjs': {
        statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}, l
      }}));
      return { code: 0, output: completeCoverage };
    }, runLintCommand: async () => ({ code: 0, output: '' }) });
    expect(code).toBe(expected);
  });

  test('runs lint after complete JSON coverage succeeds', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/complete.mjs': {
        statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}
      } }));
      return { code: 0, output: '' };
    };
    let lintCalls = 0;
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => { lintCalls += 1; return { code: 0, output: '' }; } })).resolves.toBe(0);
    expect(lintCalls).toBe(1);
    expect(messages.join('')).toContain('Tests passed');
  });

  test('rejects invalid standalone lint inputs', async () => {
    await expect(runLint({ cwd: 42, write: () => {}, runLintCommand: async () => ({ code: 0, output: '' }) })).rejects.toThrow('runLint requires');
  });

  test('reports lint executor exceptions without throwing', async () => {
    const messages = [];
    await expect(runLint({ cwd: process.cwd(), write: (message) => messages.push(message), runLintCommand: async () => { throw new Error('lint unavailable'); } })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Lint failed to start: lint unavailable');
  });

  test('uses the first usable coverage candidate even when it has gaps', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/current.mjs': { statementMap: { 0: { start: { line: 7 } } }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
      await writeFile(`${cwd}/coverage/coverage.json`, JSON.stringify({ 'src/fallback.mjs': { statementMap: { 0: { start: { line: 8 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
      return { code: 0, output: '' };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('current.mjs');
    expect(messages.join('')).not.toContain('fallback.mjs');
  });

  test('uses the third coverage candidate when earlier candidates are absent', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage.json`, JSON.stringify({ 'src/third.mjs': { statementMap: { 0: { start: { line: 3 } } }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
      return { code: 0, output: '' };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('third.mjs');
  });

  test('keeps a structurally valid malformed-metadata candidate authoritative', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({
        'src/current.mjs': { statementMap: { 0: { start: { line: 7 } } }, s: { 0: 1 }, b: { 0: [0] }, fnMap: {}, f: {} }
      }));
      return { code: 0, output: completeCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('current.mjs');
    expect(messages.join('')).not.toContain('foo.mjs');
  });

  test('falls back to text when generated JSON is invalid', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-fallback`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, '{invalid');
      await writeFile(`${cwd}/coverage/coverage.json`, JSON.stringify({ 'src/stale.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
      return { code: 0, output: completeCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
  });

  test('accepts complete text coverage when JSON has no usable entries', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-fallback-complete`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage.json`, '{}');
      return { code: 0, output: completeCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(messages.join('')).toContain('Tests passed');
    expect(messages.join('')).not.toContain('Coverage evidence missing');
  });

  test('removes stale lower-priority coverage before the current run', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-stale`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    await writeFile(`${cwd}/coverage/coverage.json`, JSON.stringify({ 'src/stale.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, '{invalid');
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('falls back to text when generated JSON has no coverage entries', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-empty`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, '{}');
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('falls back to text when generated JSON has an empty statement map', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-empty-map`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/empty.mjs': { statementMap: {} } }));
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('falls back to text when generated JSON has no statement counters', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-no-counters`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/partial.mjs': { statementMap: { 0: { start: { line: 1 } } } } }));
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('falls back to text when generated JSON has invalid coverage shapes', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-malformed`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/partial.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: { 0: 'invalid' }, fnMap: {}, f: {} } }));
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('falls back when a multi-file JSON report contains a malformed entry', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-multi-malformed`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const previousDebug = process.env.ELIWARE_TEST_DEBUG;
    process.env.ELIWARE_TEST_DEBUG = '1';
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({
        'src/valid.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} },
        'src/malformed.mjs': { statementMap: { 0: { start: { line: 2 } } }, s: { 0: 'invalid' }, branchMap: {}, b: {}, fnMap: {}, f: {} }
      }));
      return { code: 0, output: gapCoverage };
    };
    try {
      await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    } finally {
      if (previousDebug === undefined) delete process.env.ELIWARE_TEST_DEBUG;
      else process.env.ELIWARE_TEST_DEBUG = previousDebug;
    }
    expect(messages.join('')).toContain('gap.mjs');
    expect(messages.join('')).not.toContain('malformed.mjs');
    expect(messages.join('')).toContain('Debug: Coverage source: validated text fallback after unusable JSON candidates.');
  });

  test('falls back when the JSON coverage root is an array', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-array-root`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, '[]');
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('falls back when a JSON entry has an array statement map', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({ 'src/array-map.mjs': { statementMap: [], s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} } }));
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
  });

  test('falls back when JSON counters are malformed at the runner boundary', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-counter-boundary`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, JSON.stringify({
        'src/malformed.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: null }, branchMap: {}, b: {}, fnMap: {}, f: {} }
      }));
      return { code: 0, output: gapCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('gap.mjs');
    expect(messages.join('')).not.toContain('malformed.mjs');
  });

  test('reports malformed and unusable coverage candidates in debug mode', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-debug-fallback`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const previous = process.env.ELIWARE_TEST_DEBUG;
    process.env.ELIWARE_TEST_DEBUG = '1';
    try {
      const runTest = async () => {
        await writeFile(`${cwd}/coverage/coverage-final.json`, '{invalid');
        await writeFile(`${cwd}/coverage/coverage.json`, '{}');
        return { code: 0, output: gapCoverage };
      };
      await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    } finally {
      if (previous === undefined) delete process.env.ELIWARE_TEST_DEBUG;
      else process.env.ELIWARE_TEST_DEBUG = previous;
    }
    expect(messages.join('')).toContain('candidate malformed');
    expect(messages.join('')).toContain('candidate unusable');
  });

  test('fails when no coverage evidence is available', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: Coverage evidence missing');
  });

  test('fails closed when every JSON coverage candidate is malformed', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-coverage`;
    await mkdir(`${cwd}/coverage`, { recursive: true });
    const messages = [];
    const runTest = async () => {
      await writeFile(`${cwd}/coverage/coverage-final.json`, '{invalid');
      await writeFile(`${cwd}/coverage/coverage.json`, '{invalid');
      await writeFile(`${cwd}/coverage.json`, '{invalid');
      return { code: 0, output: '' };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: Coverage evidence missing');
  });

  test('fails when output contains pipes but no coverage table', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: 'unrelated | diagnostic' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: Coverage evidence missing');
  });

  test('fails when coverage has only a header', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s\n' }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: Coverage evidence missing');
  });

  test('rejects truncated text coverage evidence', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({
      code: 0, output: `${gapCoverage}\n[Output truncated: 12 characters omitted.]`
    }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: Coverage evidence missing');
  });

  test('rejects a pipe-delimited row without the Jest coverage header', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({
      code: 0, output: 'diagnostic | 99 | 99 | 99 | 99 |'
    }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: Coverage evidence missing');
  });

  test('rejects an extension-qualified numeric row without the Jest coverage header', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({
      code: 0, output: 'foo.mjs | 100 | 100 | 100 | 100 |'
    }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: Coverage evidence missing');
  });

  test('surfaces unexpected coverage-file read errors', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-error`;
    const messages = [];
    const removePath = async () => { throw new Error('coverage cleanup denied'); };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), removePath, runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage cleanup failed: coverage cleanup denied');
    expect(messages.join('')).toContain('Warning: .gitignore is missing');
  });

  test('fails closed when a coverage candidate cannot be read', async () => {
    const cwd = `${process.cwd()}/test-fixtures/json-error`;
    const messages = [];
    const runTest = async () => {
      await mkdir(`${cwd}/coverage/coverage-final.json`, { recursive: true });
      return { code: 0, output: completeCoverage };
    };
    await expect(runToolkit({ cwd, runnerArguments: [], write: output(messages), runTest, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed');
  });

  test('reports injected coverage read failures after tests pass', async () => {
    const messages = [];
    const readFilePath = async () => { throw Object.assign(new Error('read denied'), { code: 'EACCES' }); };
    await expect(runToolkit({ ...base, write: output(messages), readFilePath, runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage failed: read denied');
  });

  test('reports cleanup failures before test execution', async () => {
    const messages = [];
    let testCalls = 0;
    const removePath = async () => { throw new Error('cleanup denied'); };
    await expect(runToolkit({
      ...base,
      write: output(messages),
      removePath,
      runTest: async () => { testCalls += 1; return { code: 0, output: completeCoverage }; },
      runLintCommand: async () => ({ code: 0, output: '' })
    })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Coverage cleanup failed: cleanup denied');
    expect(testCalls).toBe(0);
  });

  test('cleans every documented coverage candidate before execution', async () => {
    const removed = [];
    await expect(runToolkit({
      ...base,
      removePath: async (path) => { removed.push(path); },
      runTest: async () => ({ code: 0, output: completeCoverage }),
      runLintCommand: async () => ({ code: 0, output: '' })
    })).resolves.toBe(0);
    expect(removed.map((path) => path.replaceAll('\\', '/'))).toEqual(expect.arrayContaining([
      `${process.cwd().replaceAll('\\', '/')}/coverage/coverage-final.json`,
      `${process.cwd().replaceAll('\\', '/')}/coverage/coverage.json`,
      `${process.cwd().replaceAll('\\', '/')}/coverage.json`
    ]));
  });

  test('reports workspace setup access failures without rejecting', async () => {
    const messages = [];
    const accessPath = async () => { throw Object.assign(new Error('access denied'), { code: 'EACCES' }); };
    await expect(runToolkit({ ...base, accessPath, write: output(messages), runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Workspace setup failed: access denied');
  });

  test('reports lint failures', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 3, output: 'warning' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Lint failed');
  });

  test('rejects lint warnings even when the process exits successfully', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: 'warning: rule violation' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Lint failed');
  });

  test('does not treat incidental warning prose as a lint warning', async () => {
    const messages = [];
    await expect(runToolkit({ ...base, write: output(messages), runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: 'No warning threshold was configured.\n' }) })).resolves.toBe(0);
    expect(messages.join('')).toContain('Tests passed | Coverage: 100×4 | Lint: 0 warnings');
  });

  test('runs standalone lint', async () => {
    const messages = [];
    await expect(runLint({ cwd: process.cwd(), write: output(messages), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    await expect(runLint({ cwd: process.cwd(), write: output(messages), runLintCommand: async () => ({ code: 1, output: 'bad lint' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Lint passed');
  });

  test('fails standalone lint before lint when Istanbul ignores violate policy', async () => {
    const messages = [];
    let invoked = false;
    await expect(runLint({
      cwd: process.cwd(),
      write: output(messages),
      findIstanbulIgnores: async () => [{ file: 'src/module.mjs', line: 8 }],
      runLintCommand: async () => { invoked = true; return { code: 0, output: '' }; }
    })).resolves.toBeGreaterThan(1);
    expect(invoked).toBe(false);
    expect(messages.join('')).toContain('src/module.mjs:8');
  });

  test('returns failure for standalone lint warnings', async () => {
    await expect(runLint({ cwd: process.cwd(), write: () => {}, runLintCommand: async () => ({ code: 0, output: 'warning: rule violation' }) })).resolves.toBeGreaterThan(1);
  });

  test('detects ANSI-prefixed warnings after file diagnostics', async () => {
    await expect(runLint({ cwd: process.cwd(), write: () => {}, runLintCommand: async () => ({ code: 0, output: 'src/file.mjs:4:2\n\u001b[33mwarning: rule violation\u001b[0m' }) })).resolves.toBeGreaterThan(1);
    await expect(runLint({ cwd: process.cwd(), write: () => {}, runLintCommand: async () => ({ code: 0, output: 'Oxlint found 1 warning in the workspace' }) })).resolves.toBeGreaterThan(1);
  });

  test('normalizes incomplete standalone lint results', async () => {
    await expect(runLint({ cwd: process.cwd(), write: () => {}, runLintCommand: async () => ({}) })).resolves.toBeGreaterThan(1);
    await expect(runLint({ cwd: process.cwd(), write: () => {}, runLintCommand: async () => ({ code: 0 }) })).resolves.toBe(0);
  });

  test('normalizes a null standalone lint result', async () => {
    await expect(runLint({ cwd: process.cwd(), write: () => {}, runLintCommand: async () => null })).resolves.toBeGreaterThan(1);
  });

  test('reports standalone lint executor errors without throwing', async () => {
    const messages = [];
    await expect(runLint({ cwd: process.cwd(), write: (message) => messages.push(message), runLintCommand: async () => { throw new Error('lint unavailable'); } })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Lint failed to start: lint unavailable');
  });

  test('reports unexpected gitignore access errors', async () => {
    const messages = [];
    const accessPath = async () => { throw Object.assign(new Error('permission denied'), { code: 'EACCES' }); };
    await expect(runLint({ cwd: process.cwd(), write: output(messages), accessPath, runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Workspace setup failed: permission denied');
  });

  test('warns when the workspace has no .gitignore without failing', async () => {
    const cwd = `${process.cwd()}/test-fixtures/coverage-gap`;
    const messages = [];
    await expect(runLint({ cwd, write: output(messages), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(messages.join('')).toContain('Warning: .gitignore is missing');
  });

  test('handles combined-run gitignore access outcomes', async () => {
    const messages = [];
    const accessPath = async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); };
    await expect(runToolkit({ ...base, write: output(messages), accessPath, runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBe(0);
    expect(messages.join('')).toContain('Warning: .gitignore is missing');
    const denied = async () => { throw Object.assign(new Error('permission denied'), { code: 'EACCES' }); };
    await expect(runToolkit({ ...base, write: output(messages), accessPath: denied, runTest: async () => ({ code: 0, output: completeCoverage }), runLintCommand: async () => ({ code: 0, output: '' }) })).resolves.toBeGreaterThan(1);
    expect(messages.join('')).toContain('Workspace setup failed: permission denied');
  });

  test('excludes invalid dependency and generated files from real linting', async () => {
    const messages = [];
    const cwd = `${process.cwd()}/test-fixtures/exclusions`;
    await expect(runLint({ cwd, write: output(messages), runLintCommand: runOxlint })).resolves.toBe(0);
    expect(messages.join('')).toContain('Lint passed: 0 warnings');
  });

});
