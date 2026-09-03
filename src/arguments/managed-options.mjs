export const MANAGED_OPTIONS = Object.freeze([
  '--coverage',
  '--detectOpenHandles',
  '--silent',
  '--coverageReporters',
  '--runTestsByPath'
]);

/**
 * Return whether Jest would be attempting to control an option owned by the
 * wrapper. Both the bare option and its `--option=value` form are protected.
 */
export function isManagedOption(argument) {
  return typeof argument === 'string'
    && MANAGED_OPTIONS.some((name) => argument === name || argument.startsWith(`${name}=`));
}
