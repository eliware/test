import { configuredScript } from '../../../src/validation/common/configured-script.mjs';

test('validates the workspace and script name', async () => {
  await expect(configuredScript(null, 'build')).rejects.toThrow(TypeError);
  await expect(configuredScript('C:/repo', null)).rejects.toThrow(TypeError);
});

test('reads configured scripts', async () => {
  await expect(configuredScript('C:/repo', 'build', async () => JSON.stringify({ scripts: { build: 'npm run compile' } })))
    .resolves.toBe('npm run compile');
});

test('returns an empty string when the script is absent', async () => {
  await expect(configuredScript('C:/repo', 'typecheck', async () => JSON.stringify({ scripts: {} }))).resolves.toBe('');
});

test('returns empty for missing, blank, or non-string scripts', async () => {
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await expect(configuredScript('C:/repo', 'build', async () => { throw missing; })).resolves.toBe('');
  await expect(configuredScript('C:/repo', 'build', async () => JSON.stringify({ scripts: { build: '   ' } }))).resolves.toBe('');
  await expect(configuredScript('C:/repo', 'build', async () => JSON.stringify({ scripts: { build: 42 } }))).resolves.toBe('');
  await expect(configuredScript('C:/repo', 'build', async () => JSON.stringify({}))).resolves.toBe('');
});

test('propagates unexpected read and parse errors', async () => {
  await expect(configuredScript('C:/repo', 'build', async () => { throw new Error('denied'); })).rejects.toThrow('denied');
  await expect(configuredScript('C:/repo', 'build', async () => '{invalid')).rejects.toThrow(SyntaxError);
});
