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
