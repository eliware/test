import { measureMonolithFiles } from '../../src/monolith/measure-monolith-files.mjs';

test('measures candidates with the configured worker pool', async () => {
  const result = await measureMonolithFiles([{ relative: 'src/a.mjs', absolute: 'src/a.mjs' }, { relative: 'tests/a.test.mjs', absolute: 'tests/a.test.mjs' }], async () => 'one\ntwo', 2);
  expect(result).toEqual(expect.arrayContaining([
    expect.objectContaining({ file: 'src/a.mjs', lines: 2 }),
    expect.objectContaining({ file: 'tests/a.test.mjs', lines: 2 }),
  ]));
});

test('uses the default worker count', async () => {
  await expect(measureMonolithFiles([{ relative: 'src/a.mjs', absolute: 'src/a.mjs' }], async () => 'one'))
    .resolves.toEqual([expect.objectContaining({ file: 'src/a.mjs', lines: 1 })]);
});
