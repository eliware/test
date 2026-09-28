import { beforeEach, expect, jest, test } from "@jest/globals";

const assessCoverageEvidence = jest.fn();
const readCoverageEvidenceFromCandidates = jest.fn();
const formatCoverageGaps = jest.fn();
const focusedPathFrom = jest.fn();
const resolveFocusedCoverage = jest.fn();
const removeRunCoverageArtifacts = jest.fn();

jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/assess-coverage-evidence.mjs",
  () => ({ assessCoverageEvidence }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-evidence-selection.mjs",
  () => ({ readCoverageEvidenceFromCandidates }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/format-coverage-gaps.mjs",
  () => ({ formatCoverageGaps }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/build-jest-arguments.mjs",
  () => ({ focusedPathFrom }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-focused-coverage.mjs",
  () => ({ resolveFocusedCoverage }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/remove-run-coverage-artifacts.mjs",
  () => ({ removeRunCoverageArtifacts }),
);

const { runCoverageCheck } =
  await import("../../../../../src/checks/general/E-0.1/E-0.1.20/run-coverage-check.mjs");
const ruleId = "E-0.1.130.14";
const run = (context, readEvidence, remove) =>
  runCoverageCheck(context, ruleId, readEvidence, remove);
const evidence = { totals: {}, aggregateGaps: [], gaps: [] };

function resetValidators() {
  jest.resetAllMocks();
  assessCoverageEvidence.mockReturnValue({ aggregateGaps: [], hasFileGaps: false });
  readCoverageEvidenceFromCandidates.mockResolvedValue(evidence);
  formatCoverageGaps.mockReturnValue("coverage gaps");
  focusedPathFrom.mockReturnValue(undefined);
  resolveFocusedCoverage.mockResolvedValue([]);
  removeRunCoverageArtifacts.mockResolvedValue(null);
}

beforeEach(resetValidators);

test("skips disabled coverage and maps unavailable Jest results", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  expect(readCoverageEvidenceFromCandidates).not.toHaveBeenCalled();

  await expect(run({ executeJest: true, jestResult: { code: 1 } })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
  await expect(run({ executeJest: true })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
  await expect(
    run({ executeJest: true, jestResult: { stdout: "malformed result" } }),
  ).resolves.toMatchObject({ status: "fail" });
  expect(removeRunCoverageArtifacts).toHaveBeenCalled();
  expect(readCoverageEvidenceFromCandidates).not.toHaveBeenCalled();
});

test("includes prior cleanup diagnostics and maps timed-out runs", async () => {
  removeRunCoverageArtifacts.mockResolvedValueOnce("current cleanup failed");
  await expect(
    run({
      executeJest: true,
      jestResult: { code: 1, cleanupError: "prior cleanup failed" },
    }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("prior cleanup failed\ncurrent cleanup failed"),
  });

  await expect(
    run({ executeJest: true, jestResult: { code: 0, timedOut: true } }),
  ).resolves.toMatchObject({
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
  expect(readCoverageEvidenceFromCandidates).not.toHaveBeenCalled();
});

test("preserves the Jest launch diagnostic when coverage cannot run", async () => {
  await expect(run({ executeJest: true, jestExecutionError: "spawn denied" })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.\nspawn denied",
  });
  expect(readCoverageEvidenceFromCandidates).not.toHaveBeenCalled();
});

test("reports cleanup failures after a Jest startup failure", async () => {
  removeRunCoverageArtifacts.mockResolvedValueOnce("current cleanup failed");
  await expect(
    run({
      executeJest: true,
      jestExecutionError: "Jest could not start\nprior cleanup failed",
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining(
      "Jest results are unavailable or indicate a failed test run.\nJest could not start\nprior cleanup failed\ncurrent cleanup failed",
    ),
  });
  expect(removeRunCoverageArtifacts).toHaveBeenCalled();
});

test("loads evidence with freshness and inventory context before assessing it", async () => {
  const context = {
    root: "/repo",
    executeJest: true,
    jestArgs: [],
    jestResult: { code: 0, stdout: "result", startedAt: 100 },
    repositoryInventory: { readText: jest.fn() },
  };

  await expect(run(context)).resolves.toEqual({ ruleId, status: "pass", message: "" });
  expect(readCoverageEvidenceFromCandidates).toHaveBeenCalledWith("/repo", "result", 100, {
    requireFresh: true,
    expectedFiles: undefined,
    inventory: context.repositoryInventory,
  });
  expect(assessCoverageEvidence).toHaveBeenCalledWith(evidence, { focusedPath: false });
  expect(removeRunCoverageArtifacts).toHaveBeenCalledWith(context, expect.any(Function));
});

test("selects focused evidence and attaches the run-specific directory", async () => {
  focusedPathFrom.mockReturnValueOnce("tests/focus.test.mjs");
  resolveFocusedCoverage.mockResolvedValueOnce(["--collectCoverageFrom", "src/focus.mjs"]);
  const context = {
    root: "/repo",
    executeJest: true,
    jestArgs: ["tests/focus.test.mjs"],
    jestCoverageDirectory: "/run/coverage",
    jestResult: { code: 0, stdout: "result", startedAt: 100 },
  };

  await expect(run(context)).resolves.toEqual({ ruleId, status: "pass", message: "" });
  expect(readCoverageEvidenceFromCandidates).toHaveBeenCalledWith("/repo", "result", 100, {
    requireFresh: true,
    expectedFiles: ["src/focus.mjs"],
    coverageDirectory: "/run/coverage",
  });
  expect(assessCoverageEvidence).toHaveBeenCalledWith(evidence, { focusedPath: true });
});

test("formats aggregate and file-level gaps from coverage evidence", async () => {
  assessCoverageEvidence.mockReturnValueOnce({ aggregateGaps: ["branches"], hasFileGaps: false });
  await expect(
    run({ executeJest: true, root: "/repo", jestResult: { code: 0 } }),
  ).resolves.toMatchObject({
    status: "fail",
    message: "coverage gaps\nAggregate gaps: branches.",
  });
  assessCoverageEvidence.mockReturnValueOnce({ aggregateGaps: [], hasFileGaps: true });
  await expect(
    run({ executeJest: true, root: "/repo", jestResult: { code: 0 } }),
  ).resolves.toMatchObject({
    status: "fail",
    message: "coverage gaps\nAggregate gaps: file-level gaps.",
  });
});

test("maps evidence errors and cleanup failures into the final result", async () => {
  readCoverageEvidenceFromCandidates.mockRejectedValueOnce(new Error("evidence missing"));
  removeRunCoverageArtifacts.mockResolvedValueOnce("cleanup failed");
  await expect(run({ executeJest: true, root: "/repo", jestResult: { code: 0 } })).resolves.toEqual(
    {
      ruleId,
      status: "fail",
      message: "evidence missing\ncleanup failed",
    },
  );

  removeRunCoverageArtifacts.mockResolvedValueOnce("cleanup failed");
  await expect(run({ executeJest: true, root: "/repo", jestResult: { code: 0 } })).resolves.toEqual(
    {
      ruleId,
      status: "fail",
      message:
        "Coverage validation cleanup failed: cleanup failed\nFix the cleanup issue and rerun npm test to confirm 100% statement, branch, function, and line coverage.",
    },
  );
});
