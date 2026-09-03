import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Warn when the consumer workspace lacks a recommended .gitignore file. */
export async function warnIfMissingGitignore(cwd, write, accessPath = access) {
  try { await accessPath(resolve(cwd, '.gitignore')); }
  catch (error) {
    if (error.code === 'ENOENT') {
      write('Warning: .gitignore is missing. Recommended entries: node_modules/, coverage/, test-results/, and *.tgz.\n');
      return;
    }
    throw error;
  }
}

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
