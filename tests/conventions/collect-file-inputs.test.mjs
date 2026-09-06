import { collectFileInputs } from '../../src/conventions/collect-file-inputs.mjs';

test('classifies discovered convention files', async () => {
  const result = await collectFileInputs('.', async () => []);
  expect(result).toEqual(expect.objectContaining({ paths: expect.any(Set), files: expect.any(Set), specFiles: expect.any(Array) }));
});
