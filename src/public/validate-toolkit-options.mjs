/** Validate the dependency-injection and flag contract for the toolkit. */
export function validateToolkitOptions(options, operation = 'toolkit') {
  if (!options || typeof options !== 'object' || Object.keys(options).length === 0) throw new TypeError(`${operation} options are required`);
  if (typeof options.cwd !== 'string' || !Array.isArray(options.runnerArguments)) throw new TypeError(`${operation} requires cwd and runnerArguments`);
  if (typeof options.write !== 'function') throw new TypeError(`${operation} requires a write function`);
  for (const name of ['runTest', 'runLintCommand', 'accessPath', 'removePath', 'readFilePath', 'statPath', 'findIstanbulIgnores', 'findMonolith', 'findSourceTestMapping', 'inspectWorkspace']) if (name in options && options[name] !== undefined && typeof options[name] !== 'function') throw new TypeError(`${operation} option ${name} must be a function`);
  for (const name of ['runInBand', 'ignoreCoverage', 'ignoreMonolithLimits', 'enforceMonolithLimits', 'debugTiming']) if (name in options && options[name] !== undefined && typeof options[name] !== 'boolean') throw new TypeError(`${operation} option ${name} must be boolean`);
  return options;
}
