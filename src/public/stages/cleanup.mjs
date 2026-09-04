import { resolve } from 'node:path';
export async function cleanupCoverage(cwd, removePath, candidates, write) {
  try { for (const candidate of candidates) await removePath(resolve(cwd, candidate), { force: true }); return true; }
  catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return false; }
}
