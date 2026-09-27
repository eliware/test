import { readFile } from "node:fs/promises";
import { coverageCandidates } from "../coverage-report-candidates.mjs";
import { findRepositoryFiles } from "../../find-repository-files.mjs";
import { readExpectedCoverageShapes } from "./coverage-source-shapes.mjs";

export async function prepareCoverageEvidenceCandidates(
  root,
  { read = readFile, expectedFiles: suppliedExpectedFiles, inventory, coverageDirectory } = {},
) {
  const expectedFiles = suppliedExpectedFiles ?? (inventory
    ? await inventory.files("coverageSource")
    : (await findRepositoryFiles(root)).filter((file) => /^src\/.*\.(?:mjs|js|cjs)$/iu.test(file)));
  const readSource = inventory?.readText ?? read;
  const readCoverage = inventory ? (path) => inventory.readText(path) : read;
  const expectedShapes = await readExpectedCoverageShapes(root, expectedFiles, readSource);
  const candidates = coverageDirectory
    ? coverageCandidates.map((path) => path.slice(path.lastIndexOf("/") + 1))
    : coverageCandidates;
  return { expectedFiles, expectedShapes, candidates, readCoverage };
}
