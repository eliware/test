import { sanitizedEnvironment } from '../../../src/processes/environment/sanitized-environment.mjs';

test('keeps only explicitly allowed variables', () => {
  expect(sanitizedEnvironment({ SAFE: 'yes', SECRET: 'no' }, ['SAFE'])).toEqual({ SAFE: 'yes' });
});

test('ignores missing and malformed allowlist entries', () => {
  expect(sanitizedEnvironment({ SAFE: 'yes' }, ['MISSING', null, 'SAFE'])).toEqual({ SAFE: 'yes' });
});
