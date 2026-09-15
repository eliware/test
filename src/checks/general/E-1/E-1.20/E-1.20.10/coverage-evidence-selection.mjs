import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseText } from "./parse-text-coverage.mjs";
import { readJsonCoverage } from "./coverage-report-readers.mjs";

const candidates = [
  "coverage/coverage-final.json",
  "coverage/coverage-summary.json",
  "coverage/coverage.json",
  "coverage.json",
];

export async function readCoverageEvidenceFromCandidates(root, testOutput = "", startedAt = 0, { read = readFile, statFile = stat, requireFresh = false } = {}) {
  if (requireFresh && !startedAt) {
    throw new Error("Coverage evidence cannot be bound to the current Jest run. Rerun Jest with coverage enabled.");
  }
  let lastError;
  const attempts = await Promise.all(candidates.map(async (relativePath) => {
    if (requireFresh && relativePath.endsWith("coverage-summary.json")) return { relativePath, skipped: true };
    try { return { relativePath, evidence: await readJsonCoverage(join(root, relativePath), relativePath, startedAt, read, statFile) }; }
    catch (error) { return { relativePath, error }; }
  }));
  for (const { relativePath, evidence, error } of attempts) {
    if (evidence) return { ...evidence, source: relativePath };
    if (error && error.code !== "ENOENT") lastError = error;
    else if (!error && !attempts.find((attempt) => attempt.relativePath === relativePath)?.skipped) lastError = new Error(`Coverage report is invalid: ${relativePath}. Rerun the tests.`);
  }
  const textEvidence = parseText(testOutput);
  if (textEvidence && requireFresh) {
    throw new Error("Jest text coverage evidence cannot prove freshness for the current run. Rerun Jest with detailed coverage enabled.");
  }
  if (textEvidence) return { ...textEvidence, source: "Jest text output" };
  throw lastError ?? new Error("Coverage evidence is missing. Rerun Jest with coverage enabled.");
}
