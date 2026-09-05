import { readMonolithInputs } from '../../src/monolith/read-inputs.mjs';

test('reads configuration and scanned files with injected collaborators', async () => {
  const result = await readMonolithInputs('C:/repo', {
    readFilePath: async () => '{}',
    readDirectory: async () => [],
    readSource: async () => '',
  });
  expect(result).toMatchObject({ config: expect.any(Object), files: [] });
});

test('uses default input options', async () => {
  await expect(readMonolithInputs(process.cwd())).resolves.toMatchObject({ config: expect.any(Object), files: expect.any(Array) });
});
