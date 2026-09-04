import { dirname, resolve } from 'node:path';

export const AUDIT_ARGUMENTS = Object.freeze(['audit', '--omit=dev', '--audit-level=moderate', '--ignore-scripts']);

export function runAudit(context) {
  if (!context || typeof context.cwd !== 'string' || typeof context.runChildProcess !== 'function') {
    throw new TypeError('runAudit requires a context with cwd and runChildProcess');
  }
  const npmPath = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  return context.runChildProcess(process.execPath, [npmPath, ...AUDIT_ARGUMENTS], {
    ...context, timeoutMs: context.timeoutMs ?? 30000,
    env: { ...context.env, npm_config_allow_scripts: undefined }
  });
}
