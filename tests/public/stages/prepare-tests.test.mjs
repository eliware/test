import { prepareTests } from '../../../src/public/stages/prepare-tests.mjs';
test('reports timing cleanup failures', async () => expect((await prepareTests({ cwd: '.', args: [], accessPath: async () => true, removePath: async () => { throw new Error('locked'); }, debugTiming: true })).cleanupError.message).toBe('locked'));
