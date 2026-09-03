import { selectSourceFiles } from '../../../src/testing/focused-coverage/select-source-files.mjs';

test('selects unique non-empty source paths', () => {
  expect(selectSourceFiles(['src/a.mjs', '', 'src/a.mjs', null, 'src/b.mjs']))
    .toEqual(['src/a.mjs', 'src/b.mjs']);
});
