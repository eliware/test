import { childEnvironment } from '../../../src/processes/environment/child-environment.mjs';

test('builds an inherited child environment and applies overrides', () => {
  expect(childEnvironment({ environment: { BASE: 'ok' }, overrides: { SAFE: 'yes' } }))
    .toEqual({ BASE: 'ok', SAFE: 'yes' });
});

test('builds a sanitized environment when inheritance is disabled', () => {
  expect(childEnvironment({
    environment: { SAFE: 'yes', SECRET: 'no' },
    inheritEnv: false,
    allowedNames: ['SAFE'],
    env: { EXTRA: 'value' }
  })).toEqual({ SAFE: 'yes', EXTRA: 'value' });
});

test('sanitizes explicitly even when inheritance remains enabled', () => {
  expect(childEnvironment({
    environment: { SAFE: 'yes', SECRET: 'no' },
    sanitize: true,
    allowedNames: ['SAFE']
  })).toEqual({ SAFE: 'yes' });
});

test('uses safe defaults when called without options', () => {
  expect(Object.keys(childEnvironment()).length).toBeGreaterThan(0);
});
