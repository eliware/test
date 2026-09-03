import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findIstanbulIgnoreViolations } from '../istanbul.mjs';
import { formatIstanbulIgnoreFailure } from './diagnostics.mjs';

export async function checkWorkspace(cwd, write, accessPath = access, findIstanbulIgnores = findIstanbulIgnoreViolations) {
  const violations = await findIstanbulIgnores(cwd);
  if (violations.length > 0) {
    write(formatIstanbulIgnoreFailure(violations));
    return false;
  }
  await warnIfMissingGitignore(cwd, write, accessPath);
  return true;
}

export async function configuredBuildScript(cwd, readFilePath = readFile) {
  let raw;
  try { raw = await readFilePath(resolve(cwd, 'package.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
  const packageJson = JSON.parse(raw);
  return typeof packageJson?.scripts?.build === 'string' && packageJson.scripts.build.trim() ? packageJson.scripts.build : '';
}

async function warnIfMissingGitignore(cwd, write, accessPath) {
  try { await accessPath(resolve(cwd, '.gitignore')); }
  catch (error) {
    if (error.code === 'ENOENT') {
      write('Warning: .gitignore is missing. Recommended entries: node_modules/, coverage/, test-results/, and *.tgz.\n');
      return;
    }
    throw error;
  }
}
