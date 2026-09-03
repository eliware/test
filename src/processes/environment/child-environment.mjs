import { inheritedEnvironment } from './inherited-environment.mjs';
import { sanitizedEnvironment } from './sanitized-environment.mjs';

/** Build the environment passed to a child process. */
export function childEnvironment({
  environment = process.env,
  sanitize = false,
  inheritEnv = true,
  allowedNames = [],
  overrides = {},
  env
} = {}) {
  const base = sanitize || inheritEnv === false
    ? sanitizedEnvironment(environment, allowedNames)
    : inheritedEnvironment(environment);
  return { ...base, ...(env ?? {}), ...overrides };
}
