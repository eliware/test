import { validateLint } from '../../public/stages/lint.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';

/** Run and normalize the post-test lint stage. */
export async function runLintStage({ cwd, write, runLintCommand, lintOptions = {} }) {
  try {
    return await validateLint(() => runLintCommand({ ...lintOptions, cwd, write, reportSuccess: false }));
  } catch (error) {
    write(`Lint validation failed: ${error?.message ?? String(error)}\n`);
    return EXIT_CODES.LINT_FAILURE;
  }
}
