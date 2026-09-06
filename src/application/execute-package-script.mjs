import { readPackageJson } from '../workspace/read-package-json.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { normalizeOutput } from '../processes/output/normalize-output.mjs';
import { normalizeCommandResult } from '../processes/command-result.mjs';
import { resolveNpmCommand } from './resolve-npm-command.mjs';
import { resolveNpmArguments } from './resolve-npm-arguments.mjs';

export async function executePackageScript(cwd, script, write, options = {}) {
  const makeResult = (code, output, diagnostic) => ({ code, category: 'package-script', script, output, diagnostic });
  let packageJson;
  try { packageJson = await Object.assign({ readPackageJson }, options).readPackageJson(cwd, options.readFilePath); }
  catch (error) { const diagnostic = `${script} failed: ${normalizeOutput(error?.message ?? error, cwd) || 'unable to read package metadata'}\n`; write(diagnostic); return makeResult(1, '', diagnostic); }
  const configuredScript = packageJson?.scripts?.[script];
  if (typeof configuredScript !== 'string' || configuredScript.trim() === '') {
    const diagnostic = `${script} failed: package.json script is missing or invalid\n`;
    write(diagnostic);
    return makeResult(1, '', diagnostic);
  }
  const platform = options.platform ?? process.platform;
  let result;
  try { result = await Object.assign({ runChildProcess }, options).runChildProcess(resolveNpmCommand(platform), resolveNpmArguments(script, platform, options.npmExecPath), { cwd }); }
  catch (error) { const diagnostic = `${script} failed: ${normalizeOutput(error?.message ?? error, cwd) || 'unable to start package script'}\n`; write(diagnostic); return makeResult(1, '', diagnostic); }
  const safeResult = normalizeCommandResult(result);
  const output = normalizeOutput(safeResult.output, cwd);
  const diagnostic = safeResult.code !== 0 ? `${script} failed${output ? `:\n${output}${output.endsWith('\n') ? '' : '\n'}` : '.\n'}` : '';
  if (diagnostic) write(diagnostic);
  return makeResult(safeResult.code, output, diagnostic);
}
