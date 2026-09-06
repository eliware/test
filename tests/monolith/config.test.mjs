import { readMonolithConfig } from '../../src/monolith/config.mjs';
test('reads configured limits and identifies package configuration', async () => { const read = async () => JSON.stringify({ eliwareTest: { monolithLimits: { source: 10, tests: 20 } } }); expect(await readMonolithConfig('.', read)).toMatchObject({ source: 10, test: 20, origin: 'package' }); });
test('preserves a useful diagnostic for malformed package metadata', async () => {
  await expect(readMonolithConfig('.', async () => '{bad json')).rejects.toThrow('Unable to read monolith configuration from package.json');
});
test('normalizes primitive package read failures', async () => {
  await expect(readMonolithConfig('.', async () => { throw 'read failed'; })).rejects.toThrow('Unable to read monolith configuration from package.json: read failed');
});

test('identifies missing package configuration while using defaults', async () => {
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await expect(readMonolithConfig('.', async () => { throw missing; })).resolves.toMatchObject({ source: 100, test: 200, origin: 'missing-package' });
});
test('uses the default package reader', async () => {
  await expect(readMonolithConfig(process.cwd())).resolves.toMatchObject({ origin: 'package' });
});
