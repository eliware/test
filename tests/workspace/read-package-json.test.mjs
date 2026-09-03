import { readPackageJson } from '../../src/workspace/read-package-json.mjs';

test('reads and parses package metadata', async () => {
  await expect(readPackageJson('C:/repo', async () => JSON.stringify({ name: 'fixture' })))
    .resolves.toEqual({ name: 'fixture' });
});
