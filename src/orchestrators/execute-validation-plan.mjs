import { executeConventionChecks } from "./execute-convention-checks.mjs";

export function executeValidationPlan(checks, context, exemptions) {
  return executeConventionChecks(checks, context, exemptions);
}
