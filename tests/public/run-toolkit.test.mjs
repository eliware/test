import { runToolkit } from '../../src/public/run-toolkit.mjs';
test('requires the toolkit caller contract', async () => {
  await expect(runToolkit(null)).rejects.toThrow(TypeError);
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: null })).rejects.toThrow(TypeError);
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: [] })).rejects.toThrow(TypeError);
});

test('normalizes unexpected pipeline failures to the internal exit code', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(),
    runnerArguments: [],
    write: (message) => messages.push(message),
    inspectWorkspace: async () => { throw new Error('workspace inspection failed'); },
    runTest: async () => ({ code: 0, output: '' }),
    runLintCommand: async () => 0
  })).resolves.toBe(14);
  expect(messages.join('')).toContain('workspace inspection failed');
});

test('formats non-Error pipeline failures', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(),
    runnerArguments: [],
    write: (message) => messages.push(message),
    inspectWorkspace: async () => { throw 'workspace failure'; },
    runTest: async () => ({ code: 0, output: '' }),
    runLintCommand: async () => 0
  })).resolves.toBe(14);
  expect(messages.join('')).toContain('workspace failure');
});

test('honors the explicit coverage opt-out', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: (message) => messages.push(message), runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(0);
  expect(messages.join('')).toContain('Coverage: ignored');
});

test('allows malformed coverage when coverage enforcement is explicitly ignored', async () => {
  await expect(runToolkit({
    cwd: process.cwd(),
    runnerArguments: [],
    ignoreCoverage: true,
    write: () => {},
    readFilePath: async () => '{ malformed coverage }',
    runTest: async () => ({ code: 0, output: '' }),
    runLintCommand: async () => 0
  })).resolves.toBe(0);
});
test('rejects a missing focused test path before invoking Jest', async () => {
  let invoked = false;
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: ['tests/missing.test.mjs'], write: (message) => messages.push(message), runTest: async () => { invoked = true; return { code: 0, output: '' }; }, runLintCommand: async () => 0 }))
    .resolves.toBe(6);
  expect(invoked).toBe(false);
  expect(messages.join('')).toContain('Focused test path not found');
});
test('fails before tests when Istanbul policy is violated', async () => {
  let invoked = false;
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message), findIstanbulIgnores: async () => [{ file: 'src/module.mjs', line: 4 }], runTest: async () => { invoked = true; return { code: 0, output: '' }; }, runLintCommand: async () => 0 })).resolves.toBe(3);
  expect(invoked).toBe(false);
  expect(messages.join('')).toContain('src/module.mjs:4');
});

test('reports mapping drift after developer tests run', async () => {
  let invoked = false;
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    findSourceTestMapping: async () => ({ missingTests: ['new-module'], orphanTests: ['old-module'] }),
    runTest: async () => { invoked = true; return { code: 0, output: '' }; }, runLintCommand: async () => 0,
  })).resolves.toBe(16);
  expect(invoked).toBe(true);
  expect(messages.join('')).toContain('Missing test pair');
  expect(messages.join('')).toContain('Test without source pair');
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

test('returns a stable coverage failure when coverage reading fails', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message), runTest: async () => ({ code: 0, output: '' }), readFilePath: async () => { throw new Error('coverage unavailable'); }, runLintCommand: async () => 0 }))
    .resolves.toBe(10);
  expect(messages.join('')).toContain('Coverage validation failed');
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

test('rejects protected Jest options before running tests', async () => { const messages = []; await expect(runToolkit({ cwd: process.cwd(), runnerArguments: ['--coverage'], write: (message) => messages.push(message), runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 })).resolves.toBe(4); expect(messages.join('')).toContain('Unsupported Jest option'); });

test('returns timing cleanup failure when timing artifact removal fails', async () => {
  const messages = [];
  let removals = 0;
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], debugTiming: true, write: (message) => messages.push(message), removePath: async (_path) => { removals += 1; if (removals > 4) throw new Error('locked'); }, runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(7);
  expect(messages.join('')).toContain('Coverage cleanup failed: locked');
});
