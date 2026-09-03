import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { checkWorkspacePolicy } from './policy.mjs';
import { warnIfMissingGitignore } from './gitignore.mjs';
export async function checkWorkspace(cwd, write, accessPath, findIstanbulIgnores) {
  if (!await checkWorkspacePolicy(cwd, write, findIstanbulIgnores)) return false;
  await warnIfMissingGitignore(cwd, write, accessPath);
  return true;
}
export async function configuredScript(cwd, name, readFilePath = readFile) {
  let raw;
  try { raw = await readFilePath(resolve(cwd, 'package.json'), 'utf8'); } catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
  const packageJson = JSON.parse(raw);
  return typeof packageJson?.scripts?.[name] === 'string' && packageJson.scripts[name].trim() ? packageJson.scripts[name] : '';
}
export const configuredBuildScript = (cwd, readFilePath) => configuredScript(cwd, 'build', readFilePath);
