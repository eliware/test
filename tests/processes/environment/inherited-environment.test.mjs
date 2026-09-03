import { inheritedEnvironment } from '../../../src/processes/environment/inherited-environment.mjs';

test('returns a defensive copy of the inherited environment', () => {
  const environment = { NODE_ENV: 'test' };
  const result = inheritedEnvironment(environment);
  expect(result).toEqual(environment);
  expect(result).not.toBe(environment);
});

test('rejects invalid environments', () => {
  expect(() => inheritedEnvironment(null)).toThrow(TypeError);
  expect(() => inheritedEnvironment('invalid')).toThrow(TypeError);
});

test('uses the process environment by default', () => {
  expect(Object.keys(inheritedEnvironment()).length).toBeGreaterThan(0);
});
