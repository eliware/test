export const STANDARD_EXCLUSIONS = Object.freeze(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build', '*.tgz']);
export const IGNORED_DIRECTORIES = new Set(STANDARD_EXCLUSIONS.filter((entry) => !entry.includes('*')));
export function oxlintExclusionArguments() { return STANDARD_EXCLUSIONS.flatMap((pattern) => ['--ignore-pattern', pattern]); }
