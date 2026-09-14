import { assertCheckResult } from "../checks/check-result.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const results = [];
  const byRuleId = new Map(checks.map((check) => [check.ruleId, check]));
  const isExempt = (ruleId) => {
    let current = byRuleId.get(ruleId);
    while (current) {
      if (exemptions.has(current.ruleId)) return true;
      current = byRuleId.get(current.parentRuleId);
    }
    return false;
  };
  for (const check of checks) {
    if (isExempt(check.ruleId)) continue;
    if (check.enforcementMode === "non-deterministic") continue;
    context.timing?.step(`${check.ruleId} started`, `${check.ruleId} completed`);
    results.push(assertCheckResult(await check.run(context), check.ruleId));
  }
  return results;
}
