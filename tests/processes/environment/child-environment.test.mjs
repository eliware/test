import { childEnvironment } from '../../../src/processes/environment/child-environment.mjs';

test('builds an inherited child environment and applies overrides', () => {
  expect(childEnvironment({ environment: { BASE: 'ok' }, overrides: { SAFE: 'yes' } }))
    .toEqual({ BASE: 'ok', SAFE: 'yes' });
});

test('passes explicit environment values and overrides through', () => {
  expect(childEnvironment({ environment: { BASE: 'ok' }, env: { EXTRA: 'value' }, overrides: { SAFE: 'yes' } }))
    .toEqual({ BASE: 'ok', EXTRA: 'value', SAFE: 'yes' });
});
