/** Validate the minimum options required by the toolkit application boundary. */
export function assertToolkitOptions(options, operation = 'toolkit') {
  if (!options || typeof options !== 'object') throw new TypeError(`${operation} options are required`);
  if (Object.keys(options).length === 0) throw new TypeError(`${operation} options are required`);
  if (typeof options.cwd !== 'string' || !Array.isArray(options.runnerArguments)) throw new TypeError(`${operation} requires cwd and runnerArguments`);
  if (typeof options.write !== 'function') throw new TypeError(`${operation} requires a write function`);
  return options;
}

/** Validate the minimum options required by the standalone lint command. */
export function assertLintOptions(options) {
  if (!options || typeof options !== 'object') throw new TypeError('lint options are required');
  if (typeof options.cwd !== 'string' || options.cwd.length === 0) throw new TypeError('lint requires cwd');
  if (typeof options.write !== 'function') throw new TypeError('lint requires a write function');
  return options;
}

/** Enforce numeric exit-code results at public command boundaries. */
export function assertExitCode(result, operation) {
  if (!Number.isInteger(result)) throw new TypeError(`${operation} must return an integer exit code`);
  return result;
}
