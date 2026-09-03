import { matchesExemption, readMonolithConfig } from '../../src/monolith/config.mjs';

test('reads explicit exemptions and matches their glob', async () => {
  const config = await readMonolithConfig('C:/repo', async () => JSON.stringify({ eliwareTest: { monolithLimits: { exemptions: [{ pattern: 'src/generated/*', reason: 'generated' }] } } }));
  expect(matchesExemption('src/generated/a.mjs', config.exemptions)).toBe(true);
});
