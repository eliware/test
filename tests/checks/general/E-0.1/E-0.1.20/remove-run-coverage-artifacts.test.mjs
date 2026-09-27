import { expect, jest, test } from "@jest/globals";
import { removeRunCoverageArtifacts } from "../../../../../src/checks/general/E-0.1/E-0.1.20/remove-run-coverage-artifacts.mjs";

test("skips cleanup when the run has no coverage directory", async () => {
  const remove = jest.fn();
  await expect(removeRunCoverageArtifacts({}, remove)).resolves.toBeNull();
  expect(remove).not.toHaveBeenCalled();
});

test("removes the run directory and clears it from context", async () => {
  const context = { jestCoverageDirectory: "/run/coverage" };
  const remove = jest.fn();
  await expect(removeRunCoverageArtifacts(context, remove)).resolves.toBeNull();
  expect(remove).toHaveBeenCalledWith("/run/coverage", { recursive: true, force: true });
  expect(context.jestCoverageDirectory).toBeUndefined();
});

test("returns a cleanup diagnostic while retaining the directory for recovery", async () => {
  const context = { jestCoverageDirectory: "/run/coverage" };
  await expect(removeRunCoverageArtifacts(context, async () => {
    throw new Error("access denied");
  })).resolves.toBe("Could not remove run-scoped coverage artifacts: access denied");
  expect(context.jestCoverageDirectory).toBe("/run/coverage");
  await expect(removeRunCoverageArtifacts(context, async () => {
    throw "cleanup denied";
  })).resolves.toBe("Could not remove run-scoped coverage artifacts: cleanup denied");
});
