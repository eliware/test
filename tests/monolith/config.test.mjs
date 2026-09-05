import { readMonolithConfig } from '../../src/monolith/config.mjs';
test('reads configured limits and identifies package configuration', async () => { const read = async () => JSON.stringify({ eliwareTest: { monolithLimits: { source: 10, tests: 20 } } }); expect(await readMonolithConfig('.', read)).toMatchObject({ source: 10, test: 20, origin: 'package' }); });

test('identifies missing package configuration while using defaults', async () => {
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await expect(readMonolithConfig('.', async () => { throw missing; })).resolves.toMatchObject({ source: 100, test: 200, origin: 'missing-package' });
});
test('uses defaults when package metadata is missing', async () => {
  await expect(readMonolithConfig('.', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }))
    .resolves.toMatchObject({ exemptions: [] });
});

test('uses the default package reader', async () => {
  await expect(readMonolithConfig(process.cwd())).resolves.toMatchObject({ origin: 'package' });
});
