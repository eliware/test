import { prepareTests } from '../../../src/public/stages/prepare-tests.mjs';
test('enables in-memory timing without filesystem cleanup', async () => expect(prepareTests({ cwd: '.', args: [], accessPath: async () => true, debugTiming: true })).resolves.toMatchObject({ timingOutput: true }));

test('returns an incomplete selection without preparing timing', async () => expect(prepareTests({ cwd: '.', args: ['tests/missing.test.mjs'], accessPath: async () => false, debugTiming: true })).resolves.toEqual({ missing: 'tests/missing.test.mjs' }));
