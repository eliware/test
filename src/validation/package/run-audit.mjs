import { dirname, resolve } from 'node:path';
import { runChildProcess } from '../../processes/run-child-process.mjs';

export const AUDIT_ARGUMENTS = Object.freeze(['audit', '--omit=dev', '--audit-level=moderate', '--ignore-scripts']);

export function runAudit(context) {
  if (!context || typeof context.cwd !== 'string') throw new TypeError('runAudit requires a context with cwd');
  const npmPath = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  return runChildProcess(process.execPath, [npmPath, ...AUDIT_ARGUMENTS], {
    ...context,
    env: { ...context.env, npm_config_allow_scripts: undefined }
  });
}
