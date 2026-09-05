import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Warn when a consumer workspace lacks a recommended .gitignore file. */
export async function warnIfMissingGitignore(cwd, write, accessPath = access) {
  try { await accessPath(resolve(cwd, '.gitignore')); }
  catch (error) {
    if (error.code === 'ENOENT') {
      write('Warning: .gitignore is missing. Recommended entries: node_modules/, coverage/, coverage.json, .nyc_output/, .eliware-test-coverage/, test-results/, and *.tgz.\n');
      return;
    }
    throw error;
  }
}
