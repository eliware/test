import { unlink } from "node:fs/promises";
import { join } from "node:path";

export const coverageCandidates = Object.freeze([
  "coverage/coverage-final.json",
  "coverage/coverage-summary.json",
  "coverage/coverage.json",
  "coverage.json",
]);
const cleanupLocks = new Map();

export async function cleanupCoverage(root, remove = unlink) {
  const previous = cleanupLocks.get(root);
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  const queued = Promise.resolve(previous).then(() => current);
  cleanupLocks.set(root, queued);
  await previous;
  const failures = [];
  try {
    await Promise.all(coverageCandidates.map(async (relativePath) => {
      try { await remove(join(root, relativePath)); }
      catch (error) { if (error.code !== "ENOENT") failures.push({ relativePath, error }); }
    }));
    if (failures.length > 0) throw new Error(`Could not remove prior coverage evidence: ${failures.map(({ relativePath, error }) => `${relativePath}: ${error.message}`).join("; ")}`);
  } finally {
    release();
    if (cleanupLocks.get(root) === queued) cleanupLocks.delete(root);
  }
}
