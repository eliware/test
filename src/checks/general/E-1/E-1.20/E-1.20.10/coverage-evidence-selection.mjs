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
  for (const relativePath of candidates) {
    if (requireFresh && relativePath.endsWith("coverage-summary.json")) continue;
    try {
      const evidence = await readJsonCoverage(join(root, relativePath), relativePath, startedAt, read, statFile);
      if (evidence) return { ...evidence, source: relativePath };
      lastError = new Error(`Coverage report is invalid: ${relativePath}. Rerun the tests.`);
    } catch (error) {
      if (error.code !== "ENOENT") lastError = error;
    }
  }
  const textEvidence = parseText(testOutput);
  if (textEvidence && requireFresh) {
    throw new Error("Jest text coverage evidence cannot prove freshness for the current run. Rerun Jest with detailed coverage enabled.");
  }
  if (textEvidence) return { ...textEvidence, source: "Jest text output" };
  throw lastError ?? new Error("Coverage evidence is missing. Rerun Jest with coverage enabled.");
}
