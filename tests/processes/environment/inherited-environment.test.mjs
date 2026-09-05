import { inheritedEnvironment } from '../../../src/processes/environment/inherited-environment.mjs';

test('returns a defensive copy of the inherited environment', () => {
  const environment = { NODE_ENV: 'test' };
  const result = inheritedEnvironment(environment);
  expect(result).toEqual(environment);
  expect(result).not.toBe(environment);
});

test('uses the caller environment when no environment is supplied', () => {
  expect(inheritedEnvironment()).toEqual(process.env);
});

test('rejects invalid environments', () => {
  expect(() => inheritedEnvironment(null)).toThrow(TypeError);
  expect(() => inheritedEnvironment('invalid')).toThrow(TypeError);
});
