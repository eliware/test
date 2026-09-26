import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseText } from "./parse-text-coverage.mjs";
import { readJsonCoverage } from "./coverage-report-readers.mjs";
import { coverageCandidates as candidates } from "../cleanup-coverage.mjs";
import { findRepositoryFiles } from "../../find-repository-files.mjs";
import { readExpectedCoverageShapes } from "./coverage-source-shapes.mjs";

function isUnusableCoverageCandidate(error) {
  const message = error instanceof Error ? error.message : "";
  return (
    error.code === "ENOENT" ||
    error instanceof SyntaxError ||
    message.startsWith("Coverage ") ||
    message.startsWith("Summary-only coverage")
  );
}

export async function readCoverageEvidenceFromCandidates(
  root,
  testOutput = "",
  startedAt = 0,
  { read = readFile, statFile = stat, requireFresh = false, expectedFiles: suppliedExpectedFiles } = {},
) {
  if (requireFresh && !startedAt) {
    throw new Error(
      "Coverage evidence cannot be bound to the current Jest run. Rerun Jest with coverage enabled.",
    );
  }
  const expectedFiles = suppliedExpectedFiles ?? (await findRepositoryFiles(root))
    .filter((file) => /^src\/.*\.(?:mjs|js|cjs)$/iu.test(file));
  const expectedShapes = await readExpectedCoverageShapes(root, expectedFiles);
  let unusableCandidateError = null;
  for (const relativePath of candidates) {
    if (requireFresh && relativePath.endsWith("coverage-summary.json")) continue;
    try {
      const evidence = await readJsonCoverage(
        join(root, relativePath),
        relativePath,
        startedAt,
        read,
        statFile,
        expectedFiles,
        expectedShapes,
      );
      if (evidence) return { ...evidence, source: relativePath };
      throw new Error(`Coverage report is invalid: ${relativePath}. Rerun the tests.`);
    } catch (error) {
      if (!isUnusableCoverageCandidate(error)) throw error;
      if (error.code !== "ENOENT") unusableCandidateError = error;
    }
  }
  if (unusableCandidateError) throw unusableCandidateError;
  const textEvidence = parseText(testOutput);
  if (textEvidence && requireFresh) {
    throw new Error(
      "Jest text coverage evidence cannot prove freshness for the current run. Rerun Jest with detailed coverage enabled.",
    );
  }
  if (textEvidence) return { ...textEvidence, source: "Jest text output" };
  throw new Error("Coverage evidence is missing. Rerun Jest with coverage enabled.");
}
