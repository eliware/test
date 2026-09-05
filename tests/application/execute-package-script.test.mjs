import { executePackageScript } from '../../src/application/execute-package-script.mjs';

test('executes a defined package script', async () => {
  const calls = [];
  await expect(executePackageScript('.', 'audit', () => {}, { readPackageJson: async () => ({ scripts: { audit: 'audit' } }), runChildProcess: async (...args) => { calls.push(args); return { code: 0, output: '' }; } })).resolves.toBe(0);
  expect(calls).toHaveLength(1);
});

test('uses default execution options', async () => {
  await expect(executePackageScript('.', 'missing', () => {})).resolves.toBe(0);
});
