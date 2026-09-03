import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findIstanbulIgnoreViolations } from './policy/istanbul-ignore-policy.mjs';
import { checkGitignorePolicy } from './policy/gitignore-policy.mjs';

/** Validate workspace policies before running child tools. */
export async function inspectWorkspace(cwd, write, accessPath, findIstanbulIgnores) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('inspectWorkspace requires a working-directory path');
  }
  if (typeof write !== 'function') {
    throw new TypeError('inspectWorkspace requires a diagnostic writer');
  }

  const findIgnores = findIstanbulIgnores ?? findIstanbulIgnoreViolations;
  const violations = await findIgnores(cwd);
  if (violations.length > 0) {
    write(`Istanbul ignore directives are not permitted here: ${violations.map((entry) => `${entry.file}:${entry.line}`).join(', ')}\n`);
    return false;
  }
  await checkGitignorePolicy(cwd, write, accessPath ?? access);
  return true;
}
