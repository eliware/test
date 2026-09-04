import { runJest } from '../../src/testing/run-jest.mjs';

test('rejects malformed invocation options', async () => {
  await expect(runJest(null, { cwd: process.cwd() })).rejects.toThrow('argument array');
  await expect(runJest([], {})).rejects.toThrow('requires cwd');
});

test('resolves and delegates the Jest command with in-band execution by default', async () => {
  const calls = [];
  await expect(runJest(['tests/example.test.mjs'], {
    cwd: process.cwd(),
    resolvePackage: () => 'C:/repo/node_modules/jest/package.json',
    jestMetadata: { bin: 'bin/jest.js' },
    buildJestCommand: (...args) => {
      calls.push(['build', ...args]);
      return { command: 'node', argumentsList: ['jest.js', ...args[1]] };
    },
    runChildProcess: (...args) => {
      calls.push(['run', ...args]);
      return { code: 0, output: '' };
    },
  })).resolves.toEqual({ code: 0, output: '' });
  expect(calls[0][0]).toBe('build');
  expect(calls[0][2]).toEqual(['tests/example.test.mjs']);
  expect(calls[0][3]).toBe(true);
  expect(calls[1][0]).toBe('run');
});

test('executes one representative bundled-Jest smoke command', async () => {
  await expect(runJest(['--version'], { cwd: process.cwd() }))
    .resolves.toMatchObject({ code: 0, output: expect.stringMatching(/\d+\./) });
});
