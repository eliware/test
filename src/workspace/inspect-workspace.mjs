import { checkWorkspacePolicies } from './check-workspace-policies.mjs';

/** Validate workspace policies before running child tools. */
export async function inspectWorkspace(cwd, write, accessPath, findIstanbulIgnores) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('inspectWorkspace requires a working-directory path');
  }
  if (typeof write !== 'function') {
    throw new TypeError('inspectWorkspace requires a diagnostic writer');
  }

  return checkWorkspacePolicies(cwd, write, accessPath, findIstanbulIgnores);
}
