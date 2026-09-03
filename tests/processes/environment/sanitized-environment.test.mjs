import { sanitizedEnvironment } from '../../../src/processes/environment/sanitized-environment.mjs';

test('keeps only explicitly allowed variables', () => {
  expect(sanitizedEnvironment({ SAFE: 'yes', SECRET: 'no' }, ['SAFE'])).toEqual({ SAFE: 'yes' });
});

test('ignores missing and malformed allowlist entries', () => {
  expect(sanitizedEnvironment({ SAFE: 'yes' }, ['MISSING', null, 'SAFE'])).toEqual({ SAFE: 'yes' });
});

test('rejects invalid environment and allowlist values', () => {
  expect(() => sanitizedEnvironment(null, [])).toThrow(TypeError);
  expect(() => sanitizedEnvironment('invalid', [])).toThrow(TypeError);
  expect(() => sanitizedEnvironment({}, 'SAFE')).toThrow(TypeError);
});

test('uses empty allowlist by default', () => {
  expect(sanitizedEnvironment({ SAFE: 'yes' })).toEqual({});
  expect(sanitizedEnvironment()).toEqual({});
});
