import { access, readFile, rename, rm, stat } from 'node:fs/promises';
import { detectViolations } from '../monolith/detect-violations.mjs';
import { runJest } from '../testing/run-jest.mjs';
import { runLintCommand } from '../application/run-lint-command.mjs';
import { inspectWorkspace } from '../workspace/inspect-workspace.mjs';
import { findSourceTestMappingDrifts } from '../architecture/validate-source-test-mapping.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { validateConventions } from '../conventions/validate-conventions.mjs';
import { readPackageJson } from '../workspace/read-package-json.mjs';

export function getToolkitDefaults() {
  return { runTest: runJest, runLintCommand, runInBand: true, ignoreCoverage: false, ignoreMonolithLimits: false, debugTiming: false, workers: 6, enforceMonolithLimits: true, accessPath: access, removePath: rm, readFilePath: readFile, statPath: stat, findMonolith: detectViolations, findSourceTestMapping: findSourceTestMappingDrifts, renamePath: rename, inspectWorkspace, runChildProcess, validateConventions, readPackageJson };
}
