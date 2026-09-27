import { executeConventionCheck } from "./execute-convention-check.mjs";
import { filterConventionChecksForExecution } from "./filter-convention-checks-for-execution.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const results = [];
  for (const check of filterConventionChecksForExecution(checks, context, exemptions))
    results.push(await executeConventionCheck(check, context));
  return results;
}
