import { unlink } from "node:fs/promises";
import { join } from "node:path";

export const coverageCandidates = Object.freeze([
  "coverage/coverage-final.json",
  "coverage/coverage-summary.json",
  "coverage/coverage.json",
  "coverage.json",
]);
export async function cleanupCoverage(root, remove = unlink) {
  const results = await Promise.all(coverageCandidates.map(async (relativePath) => {
    try {
      await remove(join(root, relativePath));
      return null;
    } catch (error) {
      return error.code === "ENOENT" ? null : { relativePath, error };
    }
  }));
  const failures = results.filter(Boolean);
  if (failures.length > 0) {
    throw new Error(`Could not remove prior coverage evidence: ${failures.map(({ relativePath, error }) => `${relativePath}: ${error.message}`).join("; ")}`);
  }
}
