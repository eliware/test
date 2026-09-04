import { EXIT_CODES } from '../../exit-codes/codes.mjs';

export async function validateLint(runLintCommand) {
  const result = await runLintCommand();
  const code = Number.isInteger(result) ? result : (Number.isInteger(result?.code) ? result.code : 1);
  return code === 0 ? 0 : (code >= EXIT_CODES.WORKSPACE_SETUP && code <= EXIT_CODES.ARCHITECTURE_MAPPING ? code : EXIT_CODES.LINT_FAILURE);
}
