import { buildOxlintArguments, runOxlint } from '../../../src/validation/lint/run-oxlint.mjs';

test('builds the managed Oxlint invocation', () => {
  expect(buildOxlintArguments()).toEqual(expect.arrayContaining(['oxlint', '--deny-warnings', '.']));
  expect(buildOxlintArguments()).toContain('--ignore-pattern');
});

test('requires a workspace context and process collaborator', () => {
  expect(() => runOxlint({})).toThrow('requires a context with cwd and runChildProcess');
  expect(() => runOxlint({ cwd: process.cwd() })).toThrow('requires a context with cwd and runChildProcess');
});

test('resolves the workspace Oxlint package and delegates the command', async () => {
  const calls = [];
  const result = await runOxlint({
    cwd: process.cwd(),
    runChildProcess: async (...args) => { calls.push(args); return { code: 0, output: '' }; }
  });
  expect(result).toEqual({ code: 0, output: '' });
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1].slice(1)).toEqual(buildOxlintArguments().slice(1));
  expect(calls[0][2].cwd).toBe(process.cwd());
});
