import { prepareTestSelection } from '../../../src/public/stages/prepare-test-selection.mjs';

test('prepares broad test selection', async () => {
  await expect(prepareTestSelection('C:/repo', [], async () => true)).resolves.toEqual({ focusedPathMode: false, focusedCoverage: [] });
});

test('prepares a focused path selection', async () => {
  await expect(prepareTestSelection(process.cwd(), ['tests/public/stages/prepare-tests.test.mjs'], async () => true))
    .resolves.toMatchObject({ focusedPathMode: true, focusedCoverage: expect.any(Array) });
});
