import { prepareTestSelection } from '../../../src/public/stages/prepare-test-selection.mjs';

test('prepares broad test selection', async () => {
  await expect(prepareTestSelection('C:/repo', [], async () => true)).resolves.toEqual({ focusedPathMode: false, focusedCoverage: [] });
});

test('prepares a focused path selection', async () => {
  await expect(prepareTestSelection(process.cwd(), ['tests/public/stages/prepare-tests.test.mjs'], async () => true))
    .resolves.toMatchObject({ focusedPathMode: true, focusedCoverage: expect.any(Array) });
});

test('returns a missing focused path without selecting coverage', async () => {
  await expect(prepareTestSelection('C:/repo', ['tests/missing.test.mjs'], async () => false)).resolves.toEqual({ missing: 'tests/missing.test.mjs' });
});
