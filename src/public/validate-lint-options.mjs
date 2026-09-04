/** Validate the public lint command contract. */
export function validateLintOptions(options) {
  if (!options || typeof options !== 'object') throw new TypeError('lint options are required');
  if (typeof options.cwd !== 'string' || options.cwd.length === 0) throw new TypeError('lint requires cwd');
  if (typeof options.write !== 'function') throw new TypeError('lint requires a write function');
  return options;
}
