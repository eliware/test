import { dirname, resolve } from 'node:path';

export const PACK_ARGUMENTS = Object.freeze(['pack', '--dry-run', '--ignore-scripts']);

export function runPack(context) {
  if (!context || typeof context.cwd !== 'string' || typeof context.runChildProcess !== 'function') {
    throw new TypeError('runPack requires a context with cwd and runChildProcess');
  }
  const npmPath = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  return context.runChildProcess(process.execPath, [npmPath, ...PACK_ARGUMENTS], {
    ...context, timeoutMs: context.timeoutMs ?? 30000,
    env: { ...context.env, npm_config_allow_scripts: undefined }
  });
}
