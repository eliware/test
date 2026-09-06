import { prepareTests } from '../../../src/public/stages/prepare-tests.mjs';
test('enables in-memory timing without filesystem cleanup', async () => expect(prepareTests({ cwd: '.', args: [], accessPath: async () => true, debugTiming: true })).resolves.toMatchObject({ timingOutput: true }));
