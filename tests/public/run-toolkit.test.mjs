import { runToolkit } from '../../src/public/run-toolkit.mjs';

test('requires the toolkit caller contract', async () => {
  await expect(runToolkit(null)).rejects.toThrow(TypeError);
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: null })).rejects.toThrow(TypeError);
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: [] })).rejects.toThrow(TypeError);
});

test('uses the bundled lint command by default', async () => {
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: () => {}, ignoreCoverage: true, runTest: async () => { throw new Error('stop before lint'); } }))
    .resolves.toBe(8);
});

test('reports test startup failures through the stable code', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message), runTest: async () => { throw new Error('unavailable'); }, runLintCommand: async () => ({ code: 0, output: '' }) }))
    .resolves.toBe(8);
  expect(messages.join('')).toContain('Tests failed to start');
});

test('honors the explicit coverage opt-out', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: (message) => messages.push(message), runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(0);
  expect(messages.join('')).toContain('Coverage: ignored');
});

test('rejects a missing focused test path before invoking Jest', async () => {
  let invoked = false;
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: ['tests/missing.test.mjs'], write: (message) => messages.push(message), runTest: async () => { invoked = true; return { code: 0, output: '' }; }, runLintCommand: async () => 0 }))
    .resolves.toBe(6);
  expect(invoked).toBe(false);
  expect(messages.join('')).toContain('Focused test path not found');
});

test('reports failed test executors without throwing', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message), runTest: async () => ({ code: 1, output: 'Expected failure' }), runLintCommand: async () => 0 }))
    .resolves.toBe(9);
  expect(messages.join('')).toContain('Tests failed');
});

test('fails before tests when Istanbul policy is violated', async () => {
  let invoked = false;
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message), findIstanbulIgnores: async () => [{ file: 'src/module.mjs', line: 4 }], runTest: async () => { invoked = true; return { code: 0, output: '' }; }, runLintCommand: async () => 0 })).resolves.toBe(3);
  expect(invoked).toBe(false);
  expect(messages.join('')).toContain('src/module.mjs:4');
});

test('enforces the monolith gate only when explicitly enabled', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], enforceMonolithLimits: true, write: (message) => messages.push(message), findMonolith: async () => [{ file: 'src/large.mjs', lines: 301, threshold: 300 }], runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 })).resolves.toBe(15);
  expect(messages.join('')).toContain('src/large.mjs');
});

test('reports monolith validator failures with the dedicated code', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, enforceMonolithLimits: true, write: (message) => messages.push(message), findMonolith: async () => { throw new Error('bad config'); }, runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(15);
  expect(messages.join('')).toContain('bad config');
});

test('preserves strict focused selection after a leading separator', async () => {
  const calls = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: ['--', 'tests/arguments/parse-arguments.test.mjs'], ignoreCoverage: true, write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: '' }; }, runLintCommand: async () => 0 })).resolves.toBe(0);
  expect(calls[0]).toEqual(expect.arrayContaining(['--runTestsByPath', 'tests/arguments/parse-arguments.test.mjs']));
});

test('normalizes a separator retained after forwarded filters', async () => {
  const calls = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: ['-t', 'focused', '--', 'tests/arguments/parse-arguments.test.mjs'], ignoreCoverage: true, write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: '' }; }, runLintCommand: async () => 0 })).resolves.toBe(0);
  expect(calls[0]).not.toContain('--');
  expect(calls[0]).toContain('tests/arguments/parse-arguments.test.mjs');
});

test('rejects lint warnings even when lint exits successfully', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: (message) => messages.push(message), runTest: async () => ({ code: 0, output: '' }), runLintCommand: async ({ write }) => { write('warning: unused variable\n'); return 13; } }))
    .resolves.toBe(13);
  expect(messages.join('')).toContain('warning');
});

test('normalizes structured and incomplete lint results', async () => {
  const base = { cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: () => {}, runTest: async () => ({ code: 0, output: '' }) };
  await expect(runToolkit({ ...base, runLintCommand: async () => ({ code: 0 }) })).resolves.toBe(0);
  await expect(runToolkit({ ...base, runLintCommand: async () => ({}) })).resolves.toBe(1);
});

test('returns a stable coverage failure when coverage reading fails', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message), runTest: async () => ({ code: 0, output: '' }), readFilePath: async () => { throw new Error('coverage unavailable'); }, runLintCommand: async () => 0 }))
    .resolves.toBe(10);
  expect(messages.join('')).toContain('Coverage validation failed');
});

test('omits in-band execution when explicitly disabled', async () => {
  const calls = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: ['--no-runInBand'], ignoreCoverage: true, write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: '' }; }, runLintCommand: async () => 0 })).resolves.toBe(0);
  expect(calls[0]).not.toContain('--runInBand');
});

test('forwards focused Jest arguments in their original order', async () => {
  const calls = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: ['-t', 'focused'], ignoreCoverage: true, write: () => {}, runTest: async (args) => { calls.push(args); return { code: 0, output: '' }; }, runLintCommand: async () => 0 })).resolves.toBe(0);
  expect(calls[0].slice(-2)).toEqual(['-t', 'focused']);
});

test('keeps mixed path and name filters together without broadening selection', async () => {
  const calls = [];
  await expect(runToolkit({
    cwd: process.cwd(),
    runnerArguments: ['tests/arguments/parse-arguments.test.mjs', '-t', 'focused'],
    ignoreCoverage: true,
    write: () => {},
    runTest: async (args) => { calls.push(args); return { code: 0, output: '' }; },
    runLintCommand: async () => 0
  })).resolves.toBe(0);
  expect(calls[0]).toContain('--runTestsByPath');
  expect(calls[0]).toContain('tests/arguments/parse-arguments.test.mjs');
  expect(calls[0].slice(-2)).toEqual(['-t', 'focused']);
});

test('runs lint after complete JSON coverage succeeds', async () => {
  const calls = [];
  await expect(runToolkit({
    cwd: process.cwd(),
    runnerArguments: [],
    write: () => {},
    runTest: async () => ({ code: 0, output: 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\n foo.mjs | 100 | 100 | 100 | 100 |' }),
    runLintCommand: async () => { calls.push('lint'); return 0; }
  })).resolves.toBe(0);
  expect(calls).toEqual(['lint']);
});

test('continues after an enabled monolith check with no violations', async () => {
  const calls = [];
  await expect(runToolkit({
    cwd: process.cwd(),
    runnerArguments: [],
    enforceMonolithLimits: true,
    ignoreCoverage: true,
    write: () => {},
    findMonolith: async () => [],
    runTest: async () => ({ code: 0, output: '' }),
    runLintCommand: async () => { calls.push('lint'); return 0; }
  })).resolves.toBe(0);
  expect(calls).toEqual(['lint']);
});

test('reports focused coverage gaps', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    runTest: async () => ({ code: 0, output: 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\n foo.mjs | 90 | 100 | 100 | 100 |' }),
    readFilePath: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); },
    runLintCommand: async () => 0
  })).resolves.toBe(11);
  expect(messages.join('')).toContain('foo.mjs');
});

test('formats and removes timing reports when timing is enabled', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], debugTiming: true, ignoreCoverage: true,
    write: (message) => messages.push(message),
    readFilePath: async (path) => path.endsWith('.eliware-test-timings.json')
      ? JSON.stringify({ testResults: [{ testFilePath: 'tests\\slow.test.mjs', perfStats: { start: 0, end: 1000 }, assertionResults: [] }] })
      : '{}',
    removePath: async () => {}, runTest: async () => ({ code: 0, output: '' }),
    runLintCommand: async () => 0
  })).resolves.toBe(0);
  expect(messages.join('')).toContain('Test file timings:');
});

test('reports malformed timing output and still cleans it up', async () => {
  const messages = [];
  let removed = false;
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], debugTiming: true, ignoreCoverage: true,
    write: (message) => messages.push(message), readFilePath: async () => '{bad json',
    removePath: async () => { removed = true; }, runTest: async () => ({ code: 0, output: '' }),
    runLintCommand: async () => 0
  })).resolves.toBe(0);
  expect(messages.join('')).toContain('Timing report unavailable');
  expect(removed).toBe(true);
});

test('continues when monolith limits are explicitly ignored', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true,
    enforceMonolithLimits: true, ignoreMonolithLimits: true,
    write: (message) => messages.push(message),
    findMonolith: async () => [{ file: 'src/large.mjs', lines: 301, threshold: 300 }],
    runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0
  })).resolves.toBe(0);
  expect(messages.join('')).toContain('limits ignored');
});

test('rejects protected Jest options before running tests', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: ['--coverage'], write: (message) => messages.push(message),
    runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0
  })).resolves.toBe(4);
  expect(messages.join('')).toContain('Unsupported Jest option');
});

test('normalizes malformed Jest results as test failures', async () => {
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], write: () => {},
    runTest: async () => null, runLintCommand: async () => 0
  })).resolves.toBe(9);
});

test('returns coverage cleanup failure when artifact removal fails', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message), removePath: async () => { throw new Error('locked'); }, runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(7);
  expect(messages.join('')).toContain('Coverage cleanup failed: locked');
});

test('returns timing cleanup failure when timing artifact removal fails', async () => {
  const messages = [];
  let removals = 0;
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], debugTiming: true, write: (message) => messages.push(message), removePath: async (_path) => { removals += 1; if (removals > 4) throw new Error('locked'); }, runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(7);
  expect(messages.join('')).toContain('Coverage cleanup failed: locked');
});

test('returns timing setup cleanup failure before tests start', async () => {
  const messages = [];
  let removals = 0;
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], debugTiming: true, write: (message) => messages.push(message), removePath: async () => { removals += 1; if (removals === 4) throw new Error('locked'); }, runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(7);
  expect(messages.join('')).toContain('Coverage cleanup failed: locked');
});
