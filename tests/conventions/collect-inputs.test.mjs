import { collectConventionInputs } from '../../src/conventions/collect-inputs.mjs';

test('collects repository inputs for convention orchestration', async () => {
  const result = await collectConventionInputs({ cwd: '.', accessPath: async () => {}, readDirectory: async () => [], readFilePath: async () => '' });
  expect(result).toEqual(expect.objectContaining({ paths: expect.any(Set), files: expect.any(Set), specFiles: expect.any(Array) }));
});

test('uses filesystem defaults when readers are omitted', async () => {
  await expect(collectConventionInputs({ cwd: '.', accessPath: async () => {}, readDirectory: async () => [] })).resolves.toEqual(expect.objectContaining({ paths: expect.any(Set) }));
});
