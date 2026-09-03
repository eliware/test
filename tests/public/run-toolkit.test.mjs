import { runToolkit } from '../../src/public/run-toolkit.mjs';

test('requires the toolkit caller contract', async () => {
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: [] })).rejects.toThrow(TypeError);
});

test('rejects incomplete runner collaborators', async () => {
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: [], write: () => {} })).rejects.toThrow('requires cwd, runnerArguments, write, runTest, and runLintCommand');
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

test('runs audit and pack after lint', async () => {
  const calls = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: () => {},
    runTest: async () => ({ code: 0, output: '' }),
    runLintCommand: async () => { calls.push('lint'); return 0; },
    runAudit: async () => { calls.push('audit'); return { code: 0, output: '' }; },
    runPack: async () => { calls.push('pack'); return { code: 0, output: '' }; }
  })).resolves.toBe(0);
  expect(calls).toEqual(['lint', 'audit', 'pack']);
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
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], enforceMonolithLimits: true, write: (message) => messages.push(message), findMonolith: async () => [{ file: 'src/large.mjs', lines: 301, threshold: 300 }], runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 })).resolves.toBe(18);
  expect(messages.join('')).toContain('src/large.mjs');
});

test('stops when configured typecheck fails', async () => {
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: () => {}, runTest: async () => ({ code: 0, output: '' }), runTypecheck: async () => ({ code: 1, output: 'type error' }), runLintCommand: async () => 0 }))
    .resolves.toBe(19);
});

test('reports configured build startup failures', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: (message) => messages.push(message), readFilePath: async (path) => path.endsWith('package.json') ? '{"scripts":{"build":"build"}}' : '', runTest: async () => ({ code: 0, output: '' }), runBuild: async () => { throw new Error('build unavailable'); }, runLintCommand: async () => 0 }))
    .resolves.toBe(17);
  expect(messages.join('')).toContain('Build failed to start');
});

test('reports monolith validator failures with the dedicated code', async () => {
  const messages = [];
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, enforceMonolithLimits: true, write: (message) => messages.push(message), findMonolith: async () => { throw new Error('bad config'); }, runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0 }))
    .resolves.toBe(18);
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

test('normalizes an incomplete configured build result as failure', async () => {
  await expect(runToolkit({ cwd: process.cwd(), runnerArguments: [], ignoreCoverage: true, write: () => {}, readFilePath: async (path) => path.endsWith('package.json') ? '{"scripts":{"build":"build"}}' : '', runTest: async () => ({ code: 0, output: '' }), runBuild: async () => null, runLintCommand: async () => 0 }))
    .resolves.toBe(17);
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
