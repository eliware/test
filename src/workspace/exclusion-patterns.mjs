/** Directories and archive patterns excluded from discovery and linting. */
export const STANDARD_EXCLUSIONS = Object.freeze(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build', '*.tgz']);

export const IGNORED_DIRECTORIES = new Set(STANDARD_EXCLUSIONS.filter((entry) => !entry.includes('*')));

/** Build Oxlint's repeated ignore-pattern argument pairs. */
export function oxlintExclusionArguments() {
  return STANDARD_EXCLUSIONS.flatMap((pattern) => ['--ignore-pattern', pattern]);
}
