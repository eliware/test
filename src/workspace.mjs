export const STANDARD_EXCLUSIONS = Object.freeze([
  '.git',
  'node_modules',
  'coverage',
  '.nyc_output',
  'test-results',
  'dist',
  'build',
  '*.tgz'
]);

export function oxlintExclusionArguments() {
  return STANDARD_EXCLUSIONS.flatMap((pattern) => ['--ignore-pattern', pattern]);
}
