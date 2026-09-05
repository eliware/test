import { executePackageScript } from './execute-package-script.mjs';

/** Public package-script lifecycle coordinator. */
export async function runPackageScript(cwd, script, write = () => {}, options = {}) {
  return executePackageScript(cwd, script, write, options);
}
