/** Validate the dependency-injection and flag contract for the toolkit. */
export function validateToolkitOptions(options, operation = 'toolkit') {
  if (!options || typeof options !== 'object' || Object.keys(options).length === 0) throw new TypeError(`${operation} options are required`);
  if (typeof options.cwd !== 'string' || options.cwd.length === 0 || !Array.isArray(options.runnerArguments) || options.runnerArguments.some((argument) => typeof argument !== 'string')) throw new TypeError(`${operation} requires cwd and runnerArguments`);
  if (typeof options.write !== 'function') throw new TypeError(`${operation} requires a write function`);
  for (const name of ['runTest', 'runLintCommand', 'accessPath', 'removePath', 'readFilePath', 'statPath', 'renamePath', 'findIstanbulIgnores', 'findMonolith', 'findSourceTestMapping', 'inspectWorkspace']) if (name in options && typeof options[name] !== 'function') throw new TypeError(`${operation} option ${name} must be a function`);
  for (const name of ['runInBand', 'ignoreCoverage', 'ignoreMonolithLimits', 'enforceMonolithLimits', 'debugTiming']) if (name in options && options[name] !== undefined && typeof options[name] !== 'boolean') throw new TypeError(`${operation} option ${name} must be boolean`);
  if ('workers' in options && (!Number.isInteger(options.workers) || options.workers <= 0)) throw new TypeError(`${operation} option workers must be a positive integer`);
  return options;
}
