import { promoteCoverageDirectory } from '../../coverage/run-directory.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';

export async function promoteTestCoverage(cwd, coverageDirectory, accessPath, removePath, renamePath, write) {
  try {
    const promoted = await promoteCoverageDirectory(cwd, coverageDirectory, accessPath, removePath, renamePath);
    if (!promoted) write('Coverage cleanup warning: Jest produced no isolated coverage directory.\n');
  } catch (error) {
    write(`Coverage cleanup failed: ${error.message}\n`);
    return { code: EXIT_CODES.COVERAGE_CLEANUP };
  }
  return undefined;
}
