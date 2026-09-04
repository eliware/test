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
  if (sanitize || inheritEnv === false) {
    const permitted = new Set(allowedNames.filter((name) => typeof name === 'string'));
    const allowed = (values = {}) => Object.fromEntries(Object.entries(values ?? {}).filter(([name]) => permitted.has(name)));
    return { ...base, ...allowed(env), ...allowed(overrides) };
  }
  return { ...base, ...env, ...overrides };
}
