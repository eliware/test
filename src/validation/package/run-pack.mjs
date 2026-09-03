import { dirname, resolve } from 'node:path';
import { runChildProcess } from '../../processes/run-child-process.mjs';

export const PACK_ARGUMENTS = Object.freeze(['pack', '--dry-run', '--ignore-scripts']);

export function runPack(context) {
  if (!context || typeof context.cwd !== 'string') throw new TypeError('runPack requires a context with cwd');
  const npmPath = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  return runChildProcess(process.execPath, [npmPath, ...PACK_ARGUMENTS], {
    ...context,
    env: { ...context.env, npm_config_allow_scripts: undefined }
  });
}
