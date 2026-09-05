import { getToolkitDefaults } from './toolkit-defaults.mjs';

/** Compose caller options over the toolkit's dependency defaults. */
export function resolveToolkitOptions(options = {}) {
  const defaults = getToolkitDefaults();
  const { cwd, runnerArguments, write, runTest = defaults.runTest, runLintCommand = defaults.runLintCommand, runInBand = defaults.runInBand, ignoreCoverage = defaults.ignoreCoverage, ignoreMonolithLimits = defaults.ignoreMonolithLimits, debugTiming = defaults.debugTiming, workers = defaults.workers, enforceMonolithLimits = defaults.enforceMonolithLimits, accessPath = defaults.accessPath, removePath = defaults.removePath, readFilePath = defaults.readFilePath, statPath = defaults.statPath, findIstanbulIgnores, findMonolith = defaults.findMonolith, findSourceTestMapping = defaults.findSourceTestMapping, renamePath = defaults.renamePath, inspectWorkspace = defaults.inspectWorkspace, runChildProcess = defaults.runChildProcess, validateConventions = defaults.validateConventions, readPackageJson = defaults.readPackageJson } = options;
  return { cwd, runnerArguments, write, runTest, runLintCommand, runInBand, ignoreCoverage, ignoreMonolithLimits, debugTiming, workers, enforceMonolithLimits, accessPath, removePath, readFilePath, statPath, findIstanbulIgnores, findMonolith, findSourceTestMapping, inspectWorkspace, renamePath, runChildProcess, validateConventions, readPackageJson };
}
