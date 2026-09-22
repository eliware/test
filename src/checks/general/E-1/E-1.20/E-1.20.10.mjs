import { fail, pass } from "../../../check-result.mjs";
import { readCoverageEvidenceFromCandidates } from "./E-1.20.10/coverage-evidence-selection.mjs";
import { formatCoverageGaps } from "./E-1.20.10/format-coverage-gaps.mjs";

export const ruleId = "E-1.20.10";
export const parentRuleId = "E-1.20";
export const focusedSafe = true;

export async function run(context, readEvidence = readCoverageEvidenceFromCandidates) {
  if (!context.executeJest) return pass(ruleId);
  if (!context.jestResult || context.jestResult.code !== 0) {
    return fail(ruleId, "Jest results are unavailable or indicate a failed test run.");
  }
  try {
    const evidence = await readEvidence(
      context.root,
      context.jestResult.stdout,
      context.jestResult.startedAt,
      { requireFresh: true },
    );
    const metrics = ["statements", "branches", "functions", "lines"];
    if (!evidence || !Array.isArray(evidence.gaps) || !evidence.totals
      || metrics.some((metric) => typeof evidence.totals[metric] !== "number" || !Number.isFinite(evidence.totals[metric]))) {
      throw new Error("Coverage evidence has an invalid shape.");
    }
    const gaps = ["statements", "branches", "functions", "lines"].filter(
      (metric) => evidence.totals[metric] !== 100,
    );
    if (gaps.length > 0 || evidence.gaps.length > 0) {
      return fail(
        ruleId,
        `${formatCoverageGaps(evidence)}\nAggregate gaps: ${gaps.join(", ") || "file-level gaps"}.`,
      );
    }
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
