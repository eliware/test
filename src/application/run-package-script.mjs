import { readPackageJson } from '../workspace/read-package-json.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
const npmCommand = 'npm';
export async function runPackageScript(cwd, script, write, options = {}) {
  const packageJson = await Object.assign({ readPackageJson }, options).readPackageJson(cwd, options.readFilePath);
  if (!packageJson?.scripts?.[script]) return 0;
  const result = await Object.assign({ runChildProcess }, options).runChildProcess(npmCommand, ['run', script], { cwd });
  if (result.code !== 0) write(`${script} failed${result.output ? `:\n${result.output}` : '.\n'}`);
  return Number.isInteger(result.code) ? result.code : 1;
}
