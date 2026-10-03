import { executeConventionCheck } from "./execute-convention-check.mjs";
import { filterConventionChecksForExecution } from "./filter-convention-checks-for-execution.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const selected = filterConventionChecksForExecution(checks, context, exemptions);
  const independent = selected.filter(({ executionPhase }) => !executionPhase);
  const jest = selected.filter(({ executionPhase }) => executionPhase === "jest");
  const dependent = selected.filter(({ executionPhase }) => executionPhase === "jest-dependent");
  const results = [];
  for (const check of independent) results.push(await executeConventionCheck(check, context));
  if (results.some(({ status }) => status === "fail")) {
    for (const check of [...jest, ...dependent]) {
      context.timing?.skip?.(check.ruleId);
      results.push({
        ruleId: check.ruleId,
        status: "skip",
        message: "Skipped because a Jest-independent check failed.",
      });
    }
    return results;
  }
  for (const check of [...jest, ...dependent])
    results.push(await executeConventionCheck(check, context));
  return results;
}
