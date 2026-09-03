import { runBuildStage } from '../../../src/runner/validation/build.mjs';
test('skips absent build scripts', async () => { await expect(runBuildStage({ runBuild: async () => ({}) }, '')).resolves.toBe(0); });
