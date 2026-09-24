import { fail, pass } from "../../../check-result.mjs";
import { assessCoverageEvidence } from "./E-1.20.10/assess-coverage-evidence.mjs";
import { readCoverageEvidenceFromCandidates } from "./E-1.20.10/coverage-evidence-selection.mjs";
import { formatCoverageGaps } from "./E-1.20.10/format-coverage-gaps.mjs";
import { focusedPathFrom } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";

export const ruleId = "E-1.20.10";
export const parentRuleId = "E-1.20";
export const focusedSafe = true;

export async function run(context, readEvidence = readCoverageEvidenceFromCandidates) {
  if (!context.executeJest) return pass(ruleId);
  if (!context.jestResult || context.jestResult.code !== 0) {
    return fail(ruleId, "Jest results are unavailable or indicate a failed test run.");
  }
  try {
    const focusedPath = focusedPathFrom(context.jestArgs ?? []);
    const focusedCoverage = await resolveFocusedCoverage(context.root, focusedPath);
    const expectedFiles = focusedCoverage.includes("--collectCoverageFrom")
      ? [focusedCoverage[focusedCoverage.indexOf("--collectCoverageFrom") + 1]]
      : undefined;
    const evidence = await readEvidence(
      context.root,
      context.jestResult.stdout,
      context.jestResult.startedAt,
      { requireFresh: true, expectedFiles },
    );
    const assessment = assessCoverageEvidence(evidence, { focusedPath: Boolean(focusedPath) });
    if (assessment.aggregateGaps.length > 0 || assessment.hasFileGaps) {
      return fail(
        ruleId,
        `${formatCoverageGaps(evidence)}\nAggregate gaps: ${assessment.aggregateGaps.join(", ") || "file-level gaps"}.`,
      );
    }
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
