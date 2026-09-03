import { PACK_ARGUMENTS, runPack } from '../../../src/validation/package/run-pack.mjs';

test('uses a dry-run package command with scripts disabled', () => {
  expect(PACK_ARGUMENTS).toEqual(['pack', '--dry-run', '--ignore-scripts']);
});

test('exposes the package invocation as an immutable argument list', () => {
  expect(Object.isFrozen(PACK_ARGUMENTS)).toBe(true);
});

test('requires a workspace context and process collaborator', () => {
  expect(() => runPack({})).toThrow('requires a context with cwd and runChildProcess');
  expect(() => runPack({ cwd: 'C:/repo' })).toThrow('requires a context with cwd and runChildProcess');
});

test('invokes npm pack with scripts disabled', async () => {
  const calls = [];
  const result = await runPack({
    cwd: 'C:/repo',
    env: { CUSTOM: 'yes', npm_config_allow_scripts: 'true' },
    runChildProcess: async (...args) => { calls.push(args); return { code: 0, output: '' }; }
  });
  expect(result).toEqual({ code: 0, output: '' });
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1].slice(1)).toEqual(PACK_ARGUMENTS);
  expect(calls[0][2]).toMatchObject({ cwd: 'C:/repo', env: { CUSTOM: 'yes', npm_config_allow_scripts: undefined } });
});
