import { jest } from '@jest/globals';
import { reportToolkitSuccess } from '../../src/public/report-toolkit-success.mjs';

test('reports enforced coverage success', () => {
  const write = jest.fn();
  reportToolkitSuccess(write);
  expect(write).toHaveBeenCalledWith('Tests passed | Coverage: 100×4 | Lint: 0 warnings\n');
});

test('reports ignored coverage explicitly', () => {
  const write = jest.fn();
  reportToolkitSuccess(write, true);
  expect(write).toHaveBeenCalledWith('Tests passed | Coverage: ignored | Lint: 0 warnings\n');
});
