import { fail, pass } from "../../../check-result.mjs";
import { assessCoverageEvidence } from "./E-0.1.20.10/assess-coverage-evidence.mjs";
import { readCoverageEvidenceFromCandidates } from "./E-0.1.20.10/coverage-evidence-selection.mjs";
import { formatCoverageGaps } from "./E-0.1.20.10/format-coverage-gaps.mjs";
import { focusedPathFrom } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";
import { rm } from "node:fs/promises";

export async function runCoverageCheck(context, ruleId, readEvidence = readCoverageEvidenceFromCandidates, remove = rm) {
  if (!context.executeJest) return pass(ruleId);
  if (!context.jestResult || context.jestResult.code !== 0 || context.jestResult.timedOut) {
    const diagnostic = context.jestResult?.cleanupError
      ? `Jest results are unavailable or indicate a failed test run.\n${context.jestResult.cleanupError}`
      : "Jest results are unavailable or indicate a failed test run.";
    const result = fail(ruleId, diagnostic);
    const cleanupError = await removeRunCoverage(context, remove);
    return cleanupError ? fail(ruleId, `${result.message}\n${cleanupError}`) : result;
  }
  let result;
  try {
    const focusedPath = focusedPathFrom(context.jestArgs ?? []);
    const focusedCoverage = await resolveFocusedCoverage(context.root, focusedPath);
    const expectedFiles = focusedCoverage.includes("--collectCoverageFrom")
      ? [focusedCoverage[focusedCoverage.indexOf("--collectCoverageFrom") + 1]]
      : undefined;
    const evidenceOptions = { requireFresh: true, expectedFiles, inventory: context.repositoryInventory };
    if (context.jestCoverageDirectory) evidenceOptions.coverageDirectory = context.jestCoverageDirectory;
    const evidence = await readEvidence(
      context.root,
      context.jestResult.stdout,
      context.jestResult.startedAt,
      evidenceOptions,
    );
    const assessment = assessCoverageEvidence(evidence, { focusedPath: Boolean(focusedPath) });
    if (assessment.aggregateGaps.length > 0 || assessment.hasFileGaps) {
      result = fail(
        ruleId,
        `${formatCoverageGaps(evidence)}\nAggregate gaps: ${assessment.aggregateGaps.join(", ") || "file-level gaps"}.`,
      );
    } else result = pass(ruleId);
  } catch (error) {
    result = fail(ruleId, error.message);
  }
  const cleanupError = await removeRunCoverage(context, remove);
  if (!cleanupError) return result;
  const message = result.status === "fail" && result.message
    ? `${result.message}\n${cleanupError}`
    : cleanupError;
  return fail(ruleId, message);
}

async function removeRunCoverage(context, remove) {
  if (!context.jestCoverageDirectory) return null;
  try {
    await remove(context.jestCoverageDirectory, { recursive: true, force: true });
    context.jestCoverageDirectory = undefined;
    return null;
  } catch (error) {
    return `Could not remove run-scoped coverage artifacts: ${error.message}`;
  }
}
