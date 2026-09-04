import { runChildProcess } from '../processes/run-child-process.mjs';
import { resolvePackage } from '../validation/resolve-package.mjs';
import { buildJestCommand } from './jest-command.mjs';
import { resolveJestBin, resolveJestRuntime } from './resolve-jest-runtime.mjs';

/** Resolve and execute the consumer's bundled Jest CLI under native ESM. */
export async function runJest(argumentsList, options) {
  if (!Array.isArray(argumentsList)) throw new TypeError('runJest requires an argument array');
  if (!options || typeof options.cwd !== 'string') throw new TypeError('runJest requires cwd');
  const resolvePackageForRun = options.resolvePackage ?? resolvePackage;
  const runtime = options.jestMetadata
    ? { packagePath: options.jestPackage ?? 'jest/package.json', metadata: options.jestMetadata }
    : resolveJestRuntime(options.cwd, resolvePackageForRun);
  const jestPath = resolveJestBin(runtime.metadata, runtime.packagePath);
  const buildCommand = options.buildJestCommand ?? buildJestCommand;
  const command = buildCommand(jestPath, argumentsList, options.runInBand !== false);
  const runProcess = options.runChildProcess ?? runChildProcess;
  return runProcess(command.command, command.argumentsList, options);
}
