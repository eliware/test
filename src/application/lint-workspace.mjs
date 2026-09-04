import { EXIT_CODES } from '../exit-codes/codes.mjs';

export async function inspectLintWorkspace({ cwd, write, inspect, accessPath, findIstanbulIgnores }) {
  try {
    if (!await inspect(cwd, write, accessPath, findIstanbulIgnores)) return EXIT_CODES.ISTANBUL_POLICY;
    return 0;
  } catch (error) {
    write(`Workspace setup failed: ${error.message}\n`);
    return EXIT_CODES.WORKSPACE_SETUP;
  }
}
