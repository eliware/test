import { readMonolithConfig } from '../../src/monolith/config.mjs';
test('reads configured limits', async () => { const read = async () => JSON.stringify({ eliwareTest: { monolithLimits: { source: 10, tests: 20 } } }); expect(await readMonolithConfig('.', read)).toMatchObject({ source: 10, test: 20 }); });
test('uses defaults when package metadata is missing', async () => {
  await expect(readMonolithConfig('.', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }))
    .resolves.toMatchObject({ exemptions: [] });
});
