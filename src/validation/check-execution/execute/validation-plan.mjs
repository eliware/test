import { executeConventionChecks } from "./convention/checks.mjs";

export async function executeValidationPlan(checks, context, exemptions) {
  return await executeConventionChecks(checks, context, exemptions);
}
