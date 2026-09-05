import { readPackageJson } from '../workspace/read-package-json.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { normalizeOutput } from '../processes/output/normalize-output.mjs';
import { dirname, join } from 'node:path';
export function resolveNpmCommand(platform = process.platform) {
  return platform === 'win32' ? process.execPath : 'npm';
}
export function resolveNpmArguments(script, platform = process.platform, npmExecPath = process.env.npm_execpath) {
  return platform === 'win32'
    ? [npmExecPath?.endsWith('.js') ? npmExecPath : join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'run', script]
    : ['run', script];
}
/** Return the child status; the toolkit boundary maps nonzero values to code 17. */
export async function runPackageScript(cwd, script, write = () => {}, options = {}) {
  const packageJson = await Object.assign({ readPackageJson }, options).readPackageJson(cwd, options.readFilePath);
  if (!packageJson?.scripts?.[script]) return 0;
  const platform = options.platform ?? process.platform;
  const result = await Object.assign({ runChildProcess }, options).runChildProcess(resolveNpmCommand(platform), resolveNpmArguments(script, platform, options.npmExecPath), { cwd });
  const safeResult = result && typeof result === 'object' ? result : {};
  const output = normalizeOutput(safeResult.output, cwd);
  if (safeResult.code !== 0) write(`${script} failed${output ? `:\n${output}` : '.\n'}`);
  return Number.isInteger(safeResult.code) ? safeResult.code : 1;
}
