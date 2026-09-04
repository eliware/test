import { buildOxlintArguments, resolveOxlintBin, resolvePackage, runOxlint } from '../../../src/validation/lint/run-oxlint.mjs';

test('builds the managed Oxlint invocation', () => {
  expect(buildOxlintArguments()).toEqual(expect.arrayContaining(['oxlint', '--deny-warnings', '.']));
  expect(buildOxlintArguments()).toContain('--ignore-pattern');
});

test('requires a workspace context and process collaborator', () => {
  expect(() => runOxlint({})).toThrow('requires a context with cwd and runChildProcess');
  expect(() => runOxlint({ cwd: process.cwd() })).toThrow('requires a context with cwd and runChildProcess');
});

test('resolves declared Oxlint bin forms and rejects missing metadata', () => {
  expect(resolveOxlintBin({ bin: 'bin/oxlint' }, 'C:/repo/node_modules/oxlint/package.json')).toMatch(/bin[\\/]oxlint$/);
  expect(() => resolveOxlintBin({}, 'C:/repo/package.json')).toThrow('does not declare');
  expect(() => resolveOxlintBin(null, 'C:/repo/package.json')).toThrow(TypeError);
});

test('falls back to package resolution', () => {
  expect(resolvePackage('oxlint/package.json', { resolve: () => { throw new Error('missing'); } }, { resolve: (name) => `package/${name}` })).toBe('package/oxlint/package.json');
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
