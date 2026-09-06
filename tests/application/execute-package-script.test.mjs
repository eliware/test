import { executePackageScript } from '../../src/application/execute-package-script.mjs';

test('executes a defined package script', async () => {
  const calls = [];
  await expect(executePackageScript('.', 'audit', () => {}, { readPackageJson: async () => ({ scripts: { audit: 'audit' } }), runChildProcess: async (...args) => { calls.push(args); return { code: 0, output: '' }; } })).resolves.toMatchObject({ code: 0, category: 'package-script', script: 'audit' });
  expect(calls).toHaveLength(1);
});

test('fails when a package script is missing', async () => {
  const messages = [];
  await expect(executePackageScript('.', 'missing', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: {} }),
  })).resolves.toMatchObject({ code: 1, category: 'package-script', script: 'missing', diagnostic: 'missing failed: package.json script is missing or invalid\n' });
  expect(messages).toEqual(['missing failed: package.json script is missing or invalid\n']);
});

test('fails when a package script is not a nonempty string', async () => {
  await expect(executePackageScript('.', 'audit', () => {}, {
    readPackageJson: async () => ({ scripts: { audit: 42 } }),
  })).resolves.toMatchObject({ code: 1, category: 'package-script', script: 'audit' });
});

test('uses default execution options when called directly', async () => {
  await expect(executePackageScript('.', 'missing', () => {})).resolves.toMatchObject({ code: 1, category: 'package-script', script: 'missing' });
});

test('separates normalized child output from the emitted diagnostic', async () => {
  const messages = [];
  await expect(executePackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit' } }),
    runChildProcess: async () => ({ code: 2, output: 'raw failure\n' }),
  })).resolves.toMatchObject({ code: 2, output: 'raw failure\n', diagnostic: 'audit failed:\nraw failure\n' });
  expect(messages).toEqual(['audit failed:\nraw failure\n']);
});
