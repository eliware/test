import { readPackageJson } from '../workspace/read-package-json.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { normalizeOutput } from '../processes/output/normalize-output.mjs';
import { normalizeCommandResult } from '../processes/command-result.mjs';
import { resolveNpmCommand } from './resolve-npm-command.mjs';
import { resolveNpmArguments } from './resolve-npm-arguments.mjs';

export async function executePackageScript(cwd, script, write, options = {}) {
  let packageJson;
  try { packageJson = await Object.assign({ readPackageJson }, options).readPackageJson(cwd, options.readFilePath); }
  catch (error) { write(`${script} failed: ${normalizeOutput(error?.message ?? error, cwd) || 'unable to read package metadata'}\n`); return 1; }
  if (!packageJson?.scripts?.[script]) return 0;
  const platform = options.platform ?? process.platform;
  let result;
  try { result = await Object.assign({ runChildProcess }, options).runChildProcess(resolveNpmCommand(platform), resolveNpmArguments(script, platform, options.npmExecPath), { cwd }); }
  catch (error) { write(`${script} failed: ${normalizeOutput(error?.message ?? error, cwd) || 'unable to start package script'}\n`); return 1; }
  const safeResult = normalizeCommandResult(result);
  const output = normalizeOutput(safeResult.output, cwd);
  if (safeResult.code !== 0) write(`${script} failed${output ? `:\n${output}${output.endsWith('\n') ? '' : '\n'}` : '.\n'}`);
  return safeResult.code;
}
