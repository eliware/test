import { toolkitResult } from '../../src/public/toolkit-result.mjs';

test('returns a stable category with the numeric code', () => {
  expect(toolkitResult(13)).toEqual({ code: 13, category: 'lint-failure' });
  expect(toolkitResult(14, { message: 'failed' })).toEqual({ code: 14, category: 'internal', message: 'failed' });
  expect(toolkitResult(18)).toEqual({ code: 18, category: 'convention-validation' });
  expect(toolkitResult(99)).toEqual({ code: 99, category: 'unknown' });
});
