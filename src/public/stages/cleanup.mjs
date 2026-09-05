import { resolve } from 'node:path';
export async function cleanupCoverage(cwd, removePath, candidates, write) {
  try {
    for (const candidate of candidates) {
      const recursive = candidate === '.eliware-test-coverage' || candidate === 'coverage.previous';
      await removePath(resolve(cwd, candidate), { force: true, ...(recursive ? { recursive: true } : {}) });
    }
    return true;
  }
  catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return false; }
}
