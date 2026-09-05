import { dirname, join } from 'node:path';

/** Build npm arguments without invoking a shell. */
export function resolveNpmArguments(script, platform = process.platform, npmExecPath = process.env.npm_execpath) {
  return platform === 'win32'
    ? [typeof npmExecPath === 'string' && npmExecPath.toLowerCase().endsWith('.js') ? npmExecPath : join(dirname(typeof npmExecPath === 'string' ? npmExecPath : process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'run', script]
    : ['run', script];
}
