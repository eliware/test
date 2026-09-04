import { EXIT_CODES } from '../../exit-codes/codes.mjs';

/** Translate focused-test preparation failures into public toolkit outcomes. */
export function handleTestPreparation(preparation, write) {
  if (preparation.missing) {
    write(`Focused test path not found: ${preparation.missing}\nUse a path relative to the consuming repository.\n`);
    return EXIT_CODES.FOCUSED_PATH_MISSING;
  }
  if (preparation.cleanupError) {
    write(`Coverage cleanup failed: ${preparation.cleanupError.message}\n`);
    return EXIT_CODES.COVERAGE_CLEANUP;
  }
  return null;
}
