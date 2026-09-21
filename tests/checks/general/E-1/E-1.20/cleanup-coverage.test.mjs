import { expect, test } from "@jest/globals";
import {
  cleanupCoverage,
  coverageCandidates,
} from "../../../../../src/checks/general/E-1/E-1.20/cleanup-coverage.mjs";

test("removes every prior coverage candidate and ignores missing files", async () => {
  const removed = [];
  await cleanupCoverage("C:/repo", async (path) => {
    removed.push(path);
    if (path.endsWith("coverage.json")) {
      const error = new Error("missing");
      error.code = "ENOENT";
      throw error;
    }
  });
  expect(removed).toHaveLength(coverageCandidates.length);
});

test("fails closed when a prior coverage candidate cannot be removed", async () => {
  await expect(
    cleanupCoverage("C:/repo", async () => {
      throw new Error("access denied");
    }),
  ).rejects.toThrow("Could not remove prior coverage evidence");
});
