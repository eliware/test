export function assertToolkitOptions(options, operation = 'toolkit') {
  if (!options || typeof options !== 'object' || Object.keys(options).length === 0) throw new TypeError(`${operation} options are required`);
  if (typeof options.cwd !== 'string' || !Array.isArray(options.runnerArguments)) throw new TypeError(`${operation} requires cwd and runnerArguments`);
  if (typeof options.write !== 'function') throw new TypeError(`${operation} requires a write function`);
  for (const name of ['runTest', 'runLintCommand', 'accessPath', 'removePath', 'readFilePath', 'findIstanbulIgnores', 'findMonolith', 'inspectWorkspace']) if (name in options && options[name] !== undefined && typeof options[name] !== 'function') throw new TypeError(`${operation} option ${name} must be a function`);
  for (const name of ['runInBand', 'ignoreCoverage', 'ignoreMonolithLimits', 'enforceMonolithLimits', 'debugTiming']) if (name in options && options[name] !== undefined && typeof options[name] !== 'boolean') throw new TypeError(`${operation} option ${name} must be boolean`);
  return options;
}
export function assertLintOptions(options) {
  if (!options || typeof options !== 'object') throw new TypeError('lint options are required');
  if (typeof options.cwd !== 'string' || options.cwd.length === 0) throw new TypeError('lint requires cwd');
  if (typeof options.write !== 'function') throw new TypeError('lint requires a write function');
  return options;
}
