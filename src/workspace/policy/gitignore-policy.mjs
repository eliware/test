import { warnIfMissingGitignore } from './warn-missing-gitignore.mjs';

export async function checkGitignorePolicy(cwd, write, accessPath) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('checkGitignorePolicy requires a working-directory path');
  }
  if (typeof write !== 'function') {
    throw new TypeError('checkGitignorePolicy requires a diagnostic writer');
  }

  await warnIfMissingGitignore(cwd, write, accessPath);
  return true;
}
