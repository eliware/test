import { validateMonolith } from '../../../src/public/stages/monolith.mjs';
test('passes without violations', async () => expect(await validateMonolith({ cwd: '.', findMonolith: async () => [], write: () => {}, ignoreMonolithLimits: false })).toBe(0));
