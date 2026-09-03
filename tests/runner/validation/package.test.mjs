import { runPackageStages } from '../../../src/runner/validation/package.mjs';
test('skips absent package collaborators', async () => { await expect(runPackageStages({})).resolves.toBe(0); });
