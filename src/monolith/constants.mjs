export const DEFAULT_LIMITS = Object.freeze({ source: 300, test: 600 });
export const MONOLITH_EXIT_CODE = 18;
export const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
export const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', 'dist', 'build', 'test-fixtures']);
