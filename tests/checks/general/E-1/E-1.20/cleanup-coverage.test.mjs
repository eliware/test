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

test("serializes cleanup operations for the same repository", async () => {
  let active = 0;
  let maximum = 0;
  const remove = async () => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active -= 1;
  };
  await Promise.all([cleanupCoverage("C:/serialized", remove), cleanupCoverage("C:/serialized", remove)]);
  expect(maximum).toBe(coverageCandidates.length);
});

test("uses the default remover for an absent repository", async () => {
  await expect(cleanupCoverage("C:/path-that-does-not-exist-eliware-test")).resolves.toBeUndefined();
});
