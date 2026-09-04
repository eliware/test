import { cleanupCoverage } from '../../../src/public/stages/cleanup.mjs';
test('cleans coverage candidates', async () => { const removed = []; expect(await cleanupCoverage('.', async (p) => removed.push(p), ['coverage'], () => {})).toBe(true); expect(removed).toHaveLength(1); });
