import { inheritedEnvironment } from './inherited-environment.mjs';

/** Build the environment passed to a child process. */
export function childEnvironment({
  environment = process.env,
  overrides = {},
  env
} = {}) {
  return { ...inheritedEnvironment(environment), ...env, ...overrides };
}
