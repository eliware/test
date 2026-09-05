import { readPackageJson } from '../workspace/read-package-json.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { normalizeOutput } from '../processes/output/normalize-output.mjs';
export function resolveNpmCommand(platform = process.platform) {
  return platform === 'win32' ? 'npm.cmd' : 'npm';
}
const npmCommand = resolveNpmCommand();
export async function runPackageScript(cwd, script, write, options = {}) {
  const packageJson = await Object.assign({ readPackageJson }, options).readPackageJson(cwd, options.readFilePath);
  if (!packageJson?.scripts?.[script]) return 0;
  const result = await Object.assign({ runChildProcess }, options).runChildProcess(npmCommand, ['run', script], { cwd });
  const output = normalizeOutput(result.output, cwd);
  if (result.code !== 0) write(`${script} failed${output ? `:\n${output}` : '.\n'}`);
  return Number.isInteger(result.code) ? result.code : 1;
}
