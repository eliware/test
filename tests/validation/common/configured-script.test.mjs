import { configuredScript } from '../../../src/validation/common/configured-script.mjs';

test('reads configured scripts', async () => {
  await expect(configuredScript('C:/repo', 'build', async () => JSON.stringify({ scripts: { build: 'npm run compile' } })))
    .resolves.toBe('npm run compile');
});

test('returns an empty string when the script is absent', async () => {
  await expect(configuredScript('C:/repo', 'typecheck', async () => JSON.stringify({ scripts: {} }))).resolves.toBe('');
});
