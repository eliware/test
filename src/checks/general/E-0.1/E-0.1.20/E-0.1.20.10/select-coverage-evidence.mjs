import { parseText } from "./parse-text-coverage.mjs";
import { isUnusableCoverageCandidateError } from "./is-unusable-coverage-candidate-error.mjs";

export async function selectCoverageEvidence(
  candidates,
  readCandidate,
  testOutput = "",
  requireFresh = false,
  expectedFiles = [],
) {
  let unusableCandidateError = null;
  for (const relativePath of candidates) {
    if (requireFresh && relativePath.endsWith("coverage-summary.json")) continue;
    try {
      const evidence = await readCandidate(relativePath);
      if (evidence) return { ...evidence, source: relativePath };
      throw new Error(`Coverage report is invalid: ${relativePath}. Rerun the tests.`);
    } catch (error) {
      if (!isUnusableCoverageCandidateError(error)) throw error;
      if (error.code !== "ENOENT") unusableCandidateError = error;
    }
  }
  if (unusableCandidateError) throw unusableCandidateError;
  const textEvidence = parseText(testOutput, expectedFiles);
  if (textEvidence && requireFresh) {
    throw new Error(
      "Jest text coverage evidence cannot prove freshness for the current run. Rerun Jest with detailed coverage enabled.",
    );
  }
  if (textEvidence) return { ...textEvidence, source: "Jest text output" };
  throw new Error("Coverage evidence is missing. Rerun Jest with coverage enabled.");
}
