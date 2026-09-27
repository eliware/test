import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { readJsonCoverage } from "./coverage-report-readers.mjs";
import { coverageCandidates as candidates } from "../coverage-report-candidates.mjs";
import { findRepositoryFiles } from "../../find-repository-files.mjs";
import { readExpectedCoverageShapes } from "./coverage-source-shapes.mjs";
import { selectCoverageEvidence } from "./select-coverage-evidence.mjs";

export async function readCoverageEvidenceFromCandidates(
  root,
  testOutput = "",
  startedAt = 0,
  {
    read = readFile,
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
  const expectedFiles = suppliedExpectedFiles ?? (inventory
    ? await inventory.files("coverageSource")
    : (await findRepositoryFiles(root)).filter((file) => /^src\/.*\.(?:mjs|js|cjs)$/iu.test(file)));
  const readRepositoryText = inventory?.readText ?? read;
  const readCoverageFile = inventory ? (path) => inventory.readText(path) : read;
  const expectedShapes = await readExpectedCoverageShapes(root, expectedFiles, readRepositoryText);
  const candidatePaths = coverageDirectory
    ? candidates.map((path) => path.slice(path.lastIndexOf("/") + 1))
    : candidates;
  return selectCoverageEvidence(candidatePaths, (relativePath) =>
    readJsonCoverage(
        join(coverageDirectory ?? root, relativePath),
        relativePath,
        startedAt,
        readCoverageFile,
        statFile,
        expectedFiles,
        expectedShapes,
        Boolean(coverageDirectory),
      ), testOutput, requireFresh, expectedFiles);
}
