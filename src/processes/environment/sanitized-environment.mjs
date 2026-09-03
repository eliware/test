/** Build a minimal environment containing only explicitly allowed variables. */
export function sanitizedEnvironment(environment = process.env, allowedNames = []) {
  if (environment === null || typeof environment !== 'object') {
    throw new TypeError('sanitizedEnvironment requires an environment object');
  }
  if (!Array.isArray(allowedNames)) {
    throw new TypeError('sanitizedEnvironment allowlist must be an array');
  }

  return Object.fromEntries(
    allowedNames
      .filter((name) => typeof name === 'string' && name in environment)
      .map((name) => [name, environment[name]])
  );
}
