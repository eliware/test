import { dirname, resolve } from 'node:path';
import { runProcess } from '../runner.mjs';
export function npmInvocation(argumentsList) { return [process.execPath, [resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), ...argumentsList]]; }
export function runNpm(argumentsList, options) {
  const [command, args] = npmInvocation(argumentsList);
  return runProcess(command, args, { ...options, env: { ...options.env, npm_config_allow_scripts: undefined } });
}
