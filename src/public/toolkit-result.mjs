const CATEGORIES = Object.freeze({
  0: 'success', 2: 'workspace-setup', 3: 'istanbul-policy', 4: 'invalid-argument',
  5: 'focused-path-validation', 6: 'focused-path-missing', 7: 'coverage-cleanup',
  8: 'test-startup', 9: 'test-failure', 10: 'coverage-failure', 11: 'coverage-gap',
  12: 'lint-startup', 13: 'lint-failure', 14: 'internal', 15: 'monolith-limit',
  16: 'architecture-mapping', 17: 'package-script-failure', 18: 'convention-validation',
});

/** Convert a pipeline code into the structured result exposed by runToolkit. */
export function toolkitResult(code, details = {}) {
  return { code, category: CATEGORIES[code] ?? 'unknown', ...details };
}
