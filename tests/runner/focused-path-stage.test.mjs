import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { focusedCoverageArguments, findMissingFocusedPath, isTestPath } from '../../src/runner/focused-path-stage.mjs';

const cwd = resolve('test-fixtures/focused-stage');

afterEach(async () => rm(cwd, { recursive: true, force: true }));

test('recognizes conventional focused paths and maps nested sources', async () => {
  await mkdir(resolve(cwd, 'tests/nested'), { recursive: true });
  await mkdir(resolve(cwd, 'src/nested'), { recursive: true });
  await writeFile(resolve(cwd, 'tests/nested/status.test.mjs'), '');
  await writeFile(resolve(cwd, 'src/nested/status.mjs'), '');
  expect(isTestPath('tests/nested/status.test.mjs')).toBe(true);
  await expect(focusedCoverageArguments(cwd, ['tests\\nested\\status.test.mjs'])).resolves.toEqual(['--collectCoverageFrom', 'src/nested/status.mjs']);
});

test('reports missing conventional focused paths', async () => {
  await mkdir(cwd, { recursive: true });
  await expect(findMissingFocusedPath(cwd, ['spec/missing.test.mjs'])).resolves.toBe('spec/missing.test.mjs');
});
