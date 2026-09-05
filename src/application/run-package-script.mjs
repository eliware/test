import { readPackageJson } from '../workspace/read-package-json.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { normalizeOutput } from '../processes/output/normalize-output.mjs';
import { normalizeCommandResult } from '../processes/command-result.mjs';
import { dirname, join } from 'node:path';
export function resolveNpmCommand(platform = process.platform) {
  return platform === 'win32' ? process.execPath : 'npm';
}
export function resolveNpmArguments(script, platform = process.platform, npmExecPath = process.env.npm_execpath) {
  return platform === 'win32'
    ? [typeof npmExecPath === 'string' && npmExecPath.toLowerCase().endsWith('.js') ? npmExecPath : join(dirname(typeof npmExecPath === 'string' ? npmExecPath : process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'run', script]
    : ['run', script];
}
/** Return the child status; the toolkit boundary maps nonzero values to code 17. */
export async function runPackageScript(cwd, script, write = () => {}, options = {}) {
  let packageJson;
  try { packageJson = await Object.assign({ readPackageJson }, options).readPackageJson(cwd, options.readFilePath); }
  catch (error) { write(`${script} failed: ${normalizeOutput(error?.message ?? error, cwd) || 'unable to read package metadata'}\n`); return 1; }
  if (!packageJson?.scripts?.[script]) return 0;
  const platform = options.platform ?? process.platform;
  let result;
  try {
    result = await Object.assign({ runChildProcess }, options).runChildProcess(resolveNpmCommand(platform), resolveNpmArguments(script, platform, options.npmExecPath), { cwd });
  } catch (error) {
    write(`${script} failed: ${normalizeOutput(error?.message ?? error, cwd) || 'unable to start package script'}\n`);
    return 1;
  }
  const safeResult = normalizeCommandResult(result);
  const output = normalizeOutput(safeResult.output, cwd);
  if (safeResult.code !== 0) write(`${script} failed${output ? `:\n${output}${output.endsWith('\n') ? '' : '\n'}` : '.\n'}`);
  return safeResult.code;
}
