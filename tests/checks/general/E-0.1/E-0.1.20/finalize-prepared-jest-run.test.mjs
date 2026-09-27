import { expect, jest, test } from "@jest/globals";
import {
  cleanupAfterPreparedJestFailure,
  finalizePreparedJestRun,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/finalize-prepared-jest-run.mjs";

const prepared = { coverageDirectory: "coverage-run" };

test.each([
  [{ code: 1 }, true],
  [{ code: 0, timedOut: true }, true],
  [{ code: 0 }, false],
])("removes artifacts when the run result does not retain them", async (result, retainCoverage) => {
  const remove = jest.fn();
  await expect(finalizePreparedJestRun(prepared, result, retainCoverage, remove)).resolves.toMatchObject({
    ...result,
    coverageDirectory: undefined,
  });
  expect(remove).toHaveBeenCalledWith("coverage-run", { recursive: true, force: true });
});

test("retains artifacts for a successful run when requested", async () => {
  const remove = jest.fn();
  await expect(finalizePreparedJestRun(prepared, { code: 0 }, true, remove)).resolves.toEqual({
    code: 0,
    coverageDirectory: "coverage-run",
  });
  expect(remove).not.toHaveBeenCalled();
});

test("keeps a result and reports cleanup failures", async () => {
  await expect(finalizePreparedJestRun(prepared, { code: 1 }, false, async () => {
    throw new Error("cleanup denied");
  })).resolves.toMatchObject({
    code: 1,
    coverageDirectory: "coverage-run",
    cleanupError: "Could not remove run-scoped coverage artifacts: cleanup denied",
  });
  await expect(finalizePreparedJestRun(prepared, { code: 1 }, false, async () => {
    throw "cleanup denied";
  })).resolves.toMatchObject({
    cleanupError: "Could not remove run-scoped coverage artifacts: cleanup denied",
  });
});

test("cleans up executor failures and preserves both errors when cleanup fails", async () => {
  const remove = jest.fn();
  await expect(cleanupAfterPreparedJestFailure(prepared, new Error("spawn failed"), remove))
    .rejects.toThrow("spawn failed");
  expect(remove).toHaveBeenCalledWith("coverage-run", { recursive: true, force: true });
  await expect(cleanupAfterPreparedJestFailure(prepared, "spawn failed", async () => {
    throw "cleanup denied";
  })).rejects.toMatchObject({
    message: "spawn failed\nCould not remove run-scoped coverage artifacts: cleanup denied",
    cause: "spawn failed",
  });
});
