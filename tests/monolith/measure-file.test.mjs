import { jest } from '@jest/globals';
import { measureMonolithFile } from '../../src/monolith/measure-file.mjs';

test('measures an eligible source file', async () => {
  await expect(measureMonolithFile({ relative: 'src/a.mjs', absolute: 'repo/src/a.mjs' }, async () => 'one\ntwo'))
    .resolves.toMatchObject({ file: 'src/a.mjs', kind: 'source', lines: 2, generated: false, pureBarrel: false });
});

test('ignores files outside the monolith policy', async () => {
  const readSource = jest.fn();
  await expect(measureMonolithFile({ relative: 'README.md', absolute: 'repo/README.md' }, readSource)).resolves.toBeNull();
  expect(readSource).not.toHaveBeenCalled();
});

test('marks generated and pure-barrel source files', async () => {
  await expect(measureMonolithFile({ relative: 'src/generated.mjs', absolute: 'repo/src/generated.mjs' }, async () => 'export * from "./value.mjs";\n// @generated'))
    .resolves.toMatchObject({ generated: true, pureBarrel: true });
});

test('measures test files without source-only barrel classification', async () => {
  await expect(measureMonolithFile({ relative: 'tests/example.test.mjs', absolute: 'repo/tests/example.test.mjs' }, async () => 'test();'))
    .resolves.toMatchObject({ kind: 'test', pureBarrel: false });
});

test('reports zero lines for an empty eligible file', async () => {
  await expect(measureMonolithFile({ relative: 'src/empty.mjs', absolute: 'repo/src/empty.mjs' }, async () => ''))
    .resolves.toMatchObject({ lines: 0 });
});
