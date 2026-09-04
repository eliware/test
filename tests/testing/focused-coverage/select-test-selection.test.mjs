import { selectTestCoverage } from '../../../src/testing/focused-coverage/select-test-selection.mjs';

test('returns no coverage selection for broad test runs', async () => {
  await expect(selectTestCoverage('C:/repo', [], async () => true, false)).resolves.toEqual([]);
});
