import { executeTests } from '../../../src/public/stages/tests.mjs';
test('normalizes test result', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => ({ code: 0, output: '' }), write: () => {} })).toMatchObject({ code: 0, output: '' }));
test('reports test startup failures', async () => expect(await executeTests({ cwd: '.', args: [], runInBand: true, focusedCoverage: [], focusedPathMode: false, runTest: async () => { throw new Error('unavailable'); }, write: () => {} })).toMatchObject({ code: 8 }));
