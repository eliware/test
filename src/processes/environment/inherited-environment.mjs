/** Return a defensive copy of the environment for inherited child execution. */
export function inheritedEnvironment(environment = process.env) {
  if (environment === null || typeof environment !== 'object') {
    throw new TypeError('inheritedEnvironment requires an environment object');
  }

  return { ...environment };
}
