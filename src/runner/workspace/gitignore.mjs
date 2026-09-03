import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
export async function warnIfMissingGitignore(cwd, write, accessPath = access) {
  try { await accessPath(resolve(cwd, '.gitignore')); }
  catch (error) { if (error.code === 'ENOENT') { write('Warning: .gitignore is missing. Recommended entries: node_modules/, coverage/, test-results/, and *.tgz.\n'); return; } throw error; }
}
