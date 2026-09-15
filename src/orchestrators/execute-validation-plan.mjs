import { executeConventionChecks } from "./execute-convention-checks.mjs";
import { validateRequiredStagePlan } from "./validate-required-stage-plan.mjs";

export async function executeValidationPlan(checks, context, exemptions) {
  validateRequiredStagePlan(checks, context, exemptions);
  return await executeConventionChecks(checks, context, exemptions);
}
