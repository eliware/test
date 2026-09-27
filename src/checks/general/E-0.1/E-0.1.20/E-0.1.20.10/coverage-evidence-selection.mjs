import { stat } from "node:fs/promises";
import { join } from "node:path";
import { readJsonCoverage } from "./coverage-report-readers.mjs";
import { prepareCoverageEvidenceCandidates } from "./prepare-coverage-evidence-candidates.mjs";
import { selectCoverageEvidence } from "./select-coverage-evidence.mjs";

export async function readCoverageEvidenceFromCandidates(
  root,
  testOutput = "",
  startedAt = 0,
  {
    read,
    statFile = stat,
    requireFresh = false,
    expectedFiles: suppliedExpectedFiles,
    inventory,
    coverageDirectory,
  } = {},
) {
  if (requireFresh && !startedAt) {
    throw new Error(
      "Coverage evidence cannot be bound to the current Jest run. Rerun Jest with coverage enabled.",
    );
  }
  const { expectedFiles, expectedShapes, candidates, readCoverage } =
    await prepareCoverageEvidenceCandidates(root, {
      read,
      expectedFiles: suppliedExpectedFiles,
      inventory,
      coverageDirectory,
    });
  return selectCoverageEvidence(
    candidates,
    (relativePath) =>
      readJsonCoverage(
        join(coverageDirectory ?? root, relativePath),
        relativePath,
        startedAt,
        readCoverage,
        statFile,
        expectedFiles,
        expectedShapes,
        Boolean(coverageDirectory),
      ),
    testOutput,
    requireFresh,
    expectedFiles,
  );
}
