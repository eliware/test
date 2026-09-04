import { access, readFile, rename, rm, stat } from 'node:fs/promises';
import { detectViolations } from '../monolith/detect-violations.mjs';
import { runJest } from '../testing/run-jest.mjs';
import { runLintCommand as defaultRunLintCommand } from '../application/run-lint-command.mjs';
import { inspectWorkspace as defaultInspectWorkspace } from '../workspace/inspect-workspace.mjs';
import { findSourceTestMappingDrifts } from '../architecture/validate-source-test-mapping.mjs';

/** Resolve toolkit defaults while preserving injectable collaborators. */
export function resolveToolkitOptions(options) {
  const {
    cwd, runnerArguments, write, runTest = runJest, runLintCommand = defaultRunLintCommand,
    runInBand = true, ignoreCoverage = false, ignoreMonolithLimits = false,
    workers = 6,
    enforceMonolithLimits = false, accessPath = access, removePath = rm, readFilePath = readFile, statPath = stat,
    findIstanbulIgnores, findMonolith = detectViolations,
    findSourceTestMapping = findSourceTestMappingDrifts, renamePath = rename,
    inspectWorkspace = defaultInspectWorkspace,
  } = options;
  return {
    cwd, runnerArguments, write, runTest, runLintCommand, runInBand, ignoreCoverage,
    ignoreMonolithLimits, workers, enforceMonolithLimits, accessPath, removePath, readFilePath, statPath,
    findIstanbulIgnores, findMonolith, findSourceTestMapping, inspectWorkspace, renamePath,
  };
}
