import { AUDIT_ARGUMENTS, runAudit } from '../../../src/validation/package/run-audit.mjs';

test('uses a production-only moderate audit', () => {
  expect(AUDIT_ARGUMENTS).toEqual(['audit', '--omit=dev', '--audit-level=moderate', '--ignore-scripts']);
});

test('requires a workspace context and process collaborator', () => {
  expect(() => runAudit({})).toThrow('requires a context with cwd and runChildProcess');
  expect(() => runAudit({ cwd: 'C:/repo' })).toThrow('requires a context with cwd and runChildProcess');
});

test('invokes npm audit with production-only settings', async () => {
  const calls = [];
  const result = await runAudit({
    cwd: 'C:/repo',
    env: { CUSTOM: 'yes', npm_config_allow_scripts: 'true' },
    runChildProcess: async (...args) => { calls.push(args); return { code: 0, output: '' }; }
  });
  expect(result).toEqual({ code: 0, output: '' });
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toBe(process.execPath);
  expect(calls[0][1].slice(1)).toEqual(AUDIT_ARGUMENTS);
  expect(calls[0][2]).toMatchObject({ cwd: 'C:/repo', env: { CUSTOM: 'yes', npm_config_allow_scripts: undefined } });
});
