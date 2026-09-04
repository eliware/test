import { access, readFile, rm } from 'node:fs/promises';
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
    enforceMonolithLimits = false, accessPath = access, removePath = rm, readFilePath = readFile,
    findIstanbulIgnores, findMonolith = detectViolations,
    findSourceTestMapping = findSourceTestMappingDrifts,
    inspectWorkspace = (options.runTest && !findIstanbulIgnores ? async () => true : defaultInspectWorkspace),
  } = options;
  return {
    cwd, runnerArguments, write, runTest, runLintCommand, runInBand, ignoreCoverage,
    ignoreMonolithLimits, enforceMonolithLimits, accessPath, removePath, readFilePath,
    findIstanbulIgnores, findMonolith, findSourceTestMapping, inspectWorkspace,
  };
}
