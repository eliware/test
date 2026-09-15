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
    if (context.modeRuleId && check.ruleId !== context.modeRuleId) continue;
    if (isExempt(check.ruleId)) continue;
    if (check.enforcementMode === "non-deterministic") continue;
    if (context.timing?.start) context.timing.start(check.ruleId);
    else context.timing?.step(`${check.ruleId} started`, `${check.ruleId} completed`);
    const result = await check.run(context);
    results.push(assertCheckResult(result, check.ruleId));
    if (context.timing?.end) context.timing.end(check.ruleId);
  }
  return results;
}
