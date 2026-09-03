/* istanbul ignore file */
export { checkWorkspace, configuredBuildScript, configuredScript } from './workspace/stage.mjs';
/*

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
  return configuredScript(cwd, 'build', readFilePath);
}

export async function configuredScript(cwd, name, readFilePath = readFile) {
  let raw;
  try { raw = await readFilePath(resolve(cwd, 'package.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
  const packageJson = JSON.parse(raw);
  return typeof packageJson?.scripts?.[name] === 'string' && packageJson.scripts[name].trim() ? packageJson.scripts[name] : '';
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
*/
