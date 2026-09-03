import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runChildProcess } from '../../processes/run-child-process.mjs';
import { oxlintExclusionArguments } from '../../workspace/exclusion-patterns.mjs';

/** Build the managed Oxlint invocation and default workspace exclusions. */
export function buildOxlintArguments() {
  return ['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()];
}

export function runOxlint(context) {
  if (!context || typeof context.cwd !== 'string') throw new TypeError('runOxlint requires a context with cwd');
  const packagePath = createRequire(resolve(context.cwd, 'package.json')).resolve('oxlint/package.json');
  const executable = resolve(dirname(packagePath), 'bin/oxlint');
  return runChildProcess(process.execPath, [executable, ...buildOxlintArguments().slice(1)], context);
}
